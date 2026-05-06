use tauri_plugin_shell::ShellExt;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn trim_video(
    app: tauri::AppHandle,
    input: String,
    output: String,
    start: String,
    end: String,
    bitrate: String,
) -> Result<String, String> {
    println!("trim_video: input={input} output={output} start={start} end={end}");

    let sidecar = app
        .shell()
        .sidecar("ffmpeg")
        .map_err(|e| format!("sidecar lookup failed: {e}"))?;

    let result = sidecar
        .args([
            "-ss", &start, "-to", &end, "-i", &input,
            "-b:v", &format!("{}k", bitrate),
            "-b:a", "128k",
            &output,
        ])
        .output()
        .await
        .map_err(|e| format!("failed to spawn ffmpeg: {e}"))?;

    let stdout = String::from_utf8_lossy(&result.stdout);
    let stderr = String::from_utf8_lossy(&result.stderr);
    println!("ffmpeg stdout:\n{stdout}");
    println!("ffmpeg stderr:\n{stderr}");

    if !result.status.success() {
        return Err(format!("ffmpeg exited with {:?}: {stderr}", result.status.code()));
    }

    Ok(output)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, trim_video])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}