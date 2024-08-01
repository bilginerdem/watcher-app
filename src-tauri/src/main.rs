// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use futures::StreamExt;
use lazy_static::lazy_static;
use std::{
  collections::HashMap,
  os::fd::{AsRawFd, FromRawFd, RawFd},
  sync::{Arc, Mutex},
};
use tauri::Window;
use tokio::net::TcpStream;
use tokio_util::codec::{Framed, LinesCodec};

#[derive(Clone, serde::Serialize)]
struct Payload {
  name: String,
  time: String,
  ip: String,
  ttl: u32,
}

lazy_static! {
  static ref CONNECTIONS: Arc<Mutex<HashMap<String, RawFd>>> = Arc::new(Mutex::new(HashMap::new()));
}

#[tauri::command]
fn client_register(window: Window, name: &str, ip: &str) {
  let ip_addr = ip.to_string();
  let name_str = name.to_string();

  tauri::async_runtime::spawn(async move {
    let stream = TcpStream::connect(ip_addr.clone()).await.expect("Connection error");
    stream.set_nodelay(true).expect("Failed to set NoDelay");
    stream.set_linger(None).expect("Failed to set Linger");
    stream.set_ttl(32).expect("Faield to set TTL");

    println!("Connected!");

    let payload = Payload {
      name: name_str.clone(),
      time: "00:00:00".to_string(),
      ip: ip_addr.clone(),
      ttl: 0,
    };

    if let Err(e) = window.emit("create", payload) {
      println!("Window emit (create) error: {:?}", e)
    };

    let raw_fd = stream.as_raw_fd();

    if let Ok(mut conns) = CONNECTIONS.lock() {
      conns.entry(name_str.clone()).or_insert(raw_fd.clone());
    }

    let mut frame = Framed::new(stream, LinesCodec::new());

    while let Some(Ok(line)) = frame.next().await {
      let raw_socket = unsafe { std::net::TcpStream::from_raw_fd(raw_fd.clone()) };

      let payload = Payload {
        name: name_str.clone(),
        time: line,
        ip: ip_addr.clone(),
        ttl: raw_socket.ttl().unwrap(),
      };

      if let Err(e) = window.emit("info", payload) {
        println!("Window emit (time) error: {:?}", e)
      };

      std::mem::forget(raw_socket);
    }
  });
}

#[tauri::command]
fn client_delete(window: Window, name: &str) {
  println!("Closing: {}", name);

  if let Ok(conns) = CONNECTIONS.lock() {
    if let Some(raw_fd) = conns.get(name) {
      let raw_socket = unsafe { std::net::TcpStream::from_raw_fd(*raw_fd) };
      raw_socket.shutdown(std::net::Shutdown::Both).unwrap();
      drop(raw_socket);

      let payload = Payload {
        name: name.to_string(),
        time: "".to_owned(),
        ip: "".to_owned(),
        ttl: 0,
      };

      if let Err(e) = window.emit("deleted", payload) {
        println!("Window emit (deleted) error: {:?}", e)
      };
    }
  }
}

#[tokio::main]
async fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![client_register, client_delete])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
