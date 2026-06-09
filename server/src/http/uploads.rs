use axum::{Json, extract::Multipart, extract::State};
use serde_json::json;
use uuid::Uuid;

use crate::{
    http::error::{AppError, AppResult},
    state::AppState,
};

/// POST /uploads — multipart file upload to S3
pub async fn create_upload(
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> AppResult<Json<serde_json::Value>> {
    let region = state.config.aws_region.as_deref()
        .ok_or_else(|| AppError::ServiceUnavailable("AWS_REGION not configured".into()))?;
    let bucket = state.config.aws_bucket_name.as_deref()
        .ok_or_else(|| AppError::ServiceUnavailable("AWS_BUCKET_NAME not configured".into()))?;
    let access_key = state.config.aws_access_key.as_deref()
        .ok_or_else(|| AppError::ServiceUnavailable("AWS_ACCESS_KEY not configured".into()))?;
    let secret_key = state.config.aws_secret_key.as_deref()
        .ok_or_else(|| AppError::ServiceUnavailable("AWS_SECRET_KEY not configured".into()))?;

    // Extract the file field from multipart
    let mut file_data: Option<(String, String, Vec<u8>)> = None;
    while let Some(field) = multipart.next_field().await.map_err(|e| {
        AppError::BadRequest(format!("Failed to read multipart field: {e}"))
    })? {
        let field_name = field.name().unwrap_or("").to_string();
        if field_name == "file" {
            let filename = field.file_name().unwrap_or("unnamed").to_string();
            let content_type = field.content_type().unwrap_or("application/octet-stream").to_string();
            let bytes = field.bytes().await.map_err(|e| {
                AppError::BadRequest(format!("Failed to read file bytes: {e}"))
            })?;
            file_data = Some((filename, content_type, bytes.to_vec()));
            break;
        }
    }

    let (filename, content_type, bytes) = file_data
        .ok_or_else(|| AppError::BadRequest("No 'file' field found in multipart body".into()))?;

    let size = bytes.len();
    if size == 0 {
        return Err(AppError::BadRequest("File is empty".into()));
    }
    if size > 10 * 1024 * 1024 {
        return Err(AppError::BadRequest("File exceeds 10 MB limit".into()));
    }

    // Build S3 client
    let creds = aws_sdk_s3::config::Credentials::new(access_key, secret_key, None, None, "env");
    let s3_config = aws_sdk_s3::Config::builder()
        .region(aws_sdk_s3::config::Region::new(region.to_string()))
        .credentials_provider(creds)
        .behavior_version_latest()
        .build();
    let client = aws_sdk_s3::Client::from_conf(s3_config);

    // Generate unique key
    let upload_id = Uuid::now_v7();
    let safe_filename = filename.replace(['/', '\\', '\0'], "_");
    let key = format!("uploads/{upload_id}/{safe_filename}");

    // Upload to S3 (bucket policy allows public read on uploads/* prefix)
    client
        .put_object()
        .bucket(bucket)
        .key(&key)
        .body(aws_sdk_s3::primitives::ByteStream::from(bytes))
        .content_type(&content_type)
        .send()
        .await
        .map_err(|e| AppError::Internal(format!("S3 upload failed: {e}")))?;

    // Construct public URL
    let public_url = format!("https://{bucket}.s3.{region}.amazonaws.com/{key}");

    Ok(Json(json!({
        "url": public_url,
        "publicUrl": public_url,
        "key": key,
        "filename": safe_filename,
        "contentType": content_type,
        "size": size
    })))
}
