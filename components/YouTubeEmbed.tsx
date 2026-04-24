import React from "react";
import { View, Text, Image, TouchableOpacity, Linking, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

/**
 * Check if a string is a valid YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

/**
 * Get YouTube thumbnail URL from video ID
 */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

interface YouTubeEmbedProps {
  url: string;
  height?: number;
}

/**
 * Renders a YouTube video as a clickable thumbnail with play button.
 * Tapping opens the video in the YouTube app or browser.
 * This approach avoids WebView embed issues (Error 150/153).
 */
export default function YouTubeEmbed({ url, height = 220 }: YouTubeEmbedProps) {
  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return (
      <View
        style={{
          height,
          backgroundColor: "#1a1a2e",
          borderRadius: 12,
          justifyContent: "center",
          alignItems: "center",
        }}>
        <Ionicons name="alert-circle-outline" size={32} color="#6b7280" />
        <Text style={{ color: "#6b7280", marginTop: 8, fontSize: 13 }}>
          Invalid YouTube URL
        </Text>
      </View>
    );
  }

  const thumbnailUrl = getYouTubeThumbnail(videoId);
  const youtubeAppUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const handlePress = () => {
    Linking.openURL(youtubeAppUrl);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      style={{
        height,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#000",
      }}>
      {/* Thumbnail */}
      <Image
        source={{ uri: thumbnailUrl }}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
      />

      {/* Dark overlay */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.25)",
          justifyContent: "center",
          alignItems: "center",
        }}>
        {/* Play button */}
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: "rgba(255, 0, 0, 0.9)",
            justifyContent: "center",
            alignItems: "center",
          }}>
          <Ionicons name="play" size={32} color="white" style={{ marginLeft: 4 }} />
        </View>
      </View>

      {/* YouTube badge */}
      <View
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          backgroundColor: "rgba(255, 0, 0, 0.9)",
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          flexDirection: "row",
          alignItems: "center",
        }}>
        <Ionicons name="logo-youtube" size={14} color="white" />
        <Text
          style={{
            color: "white",
            fontSize: 11,
            fontWeight: "600",
            marginLeft: 4,
          }}>
          YouTube
        </Text>
      </View>

      {/* "Tap to play" hint */}
      <View
        style={{
          position: "absolute",
          bottom: 8,
          right: 8,
          backgroundColor: "rgba(0,0,0,0.6)",
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          flexDirection: "row",
          alignItems: "center",
        }}>
        <Ionicons name="open-outline" size={12} color="white" />
        <Text
          style={{
            color: "white",
            fontSize: 10,
            fontWeight: "500",
            marginLeft: 4,
          }}>
          Tap to watch
        </Text>
      </View>
    </TouchableOpacity>
  );
}
