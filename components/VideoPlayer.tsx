import React from 'react';
import { WebView } from 'react-native-webview';

interface VideoPlayerProps {
  uri: string;
  height?: number;
}

export default function VideoPlayer({ uri, height = 256 }: VideoPlayerProps) {
  const html = `<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>*{margin:0;padding:0;background:#000;} video{width:100%;height:100%;object-fit:contain;}</style>
  </head><body>
    <video src="${uri}" controls playsinline loop style="width:100%;height:${height}px"></video>
  </body></html>`;

  return (
    <WebView
      source={{ html }}
      style={{ width: '100%', height: height }}
      javaScriptEnabled
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      scrollEnabled={false}
    />
  );
}
