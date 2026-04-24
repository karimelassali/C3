import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { createPost, getCurrentUserProfile, uploadPostMedia } from "../../lib/supabase";
import PickImag from "@/components/pickImage";
import YouTubeEmbed, { isYouTubeUrl, extractYouTubeId, getYouTubeThumbnail } from "@/components/YouTubeEmbed";

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface MediaAsset {
  uri: string;
  type: string; // 'image' or 'video'
  duration?: number;
  width?: number;
  height?: number;
  fileName?: string;
}

export default function CreatePostScreen() {
  const [content, setContent] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeModalVisible, setYoutubeModalVisible] = useState(false);
  const [youtubeLink, setYoutubeLink] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const { data, error } = await getCurrentUserProfile();
      if (error) {
        console.error("Error loading current user:", error);
      } else {
        setCurrentUser(data);
      }
    } catch (error) {
      console.error("Error loading current user:", error);
    }
  };

  const handleMediaPicker = async (asset: MediaAsset) => {
    setSelectedMedia(asset);
    setUploading(true);
    try {
      const { data, error } = await uploadPostMedia(asset.uri, asset.type);
      if (error) {
        Alert.alert("Upload Error", (error as any)?.message || "Failed to upload media");
        setSelectedMedia(null);
      } else {
        setUploadedUrl(data);
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong while uploading");
      setSelectedMedia(null);
    } finally {
      setUploading(false);
    }
  };

  const handleYouTubeAdd = () => {
    if (!youtubeUrl.trim()) {
      Alert.alert("Error", "Please enter a YouTube URL");
      return;
    }
    if (!isYouTubeUrl(youtubeUrl.trim())) {
      Alert.alert("Invalid URL", "Please enter a valid YouTube link");
      return;
    }
    setYoutubeLink(youtubeUrl.trim());
    // Clear any existing file media
    setSelectedMedia(null);
    setUploadedUrl(null);
    setYoutubeModalVisible(false);
    setYoutubeUrl("");
  };

  const removeYouTube = () => {
    setYoutubeLink(null);
  };

  const handlePost = async () => {
    if (!content.trim() && !uploadedUrl && !youtubeLink) {
      Alert.alert("Error", "Please write something or add media to post");
      return;
    }

    setLoading(true);
    try {
      // If YouTube link, store the URL directly as image_url with media_type 'youtube'
      const mediaUrl = youtubeLink || uploadedUrl || undefined;
      const mediaType = youtubeLink ? 'youtube' : selectedMedia?.type || undefined;

      const { error } = await createPost(
        content,
        mediaUrl,
        mediaType
      );

      if (error) {
        Alert.alert("Error", (error as any)?.message || "Failed to create post");
      } else {
        Alert.alert("Success", "Post created successfully!", [
          {
            text: "OK",
            onPress: () => {
              setContent("");
              setSelectedMedia(null);
              setUploadedUrl(null);
              setYoutubeLink(null);
              router.back();
            },
          },
        ]);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to create post" +
          (error instanceof Error ? `: ${error.message}` : "")
      );
    } finally {
      setLoading(false);
    }
  };

  const removeMedia = () => {
    setSelectedMedia(null);
    setUploadedUrl(null);
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900 dark:text-white">
          Create Post
        </Text>
        <TouchableOpacity
          onPress={handlePost}
          disabled={loading || uploading || (!content.trim() && !uploadedUrl && !youtubeLink)}
          className={`px-4 py-2 rounded-full ${
            loading || uploading || (!content.trim() && !uploadedUrl && !youtubeLink)
              ? "bg-gray-300 dark:bg-gray-600"
              : "bg-blue-500"
          }`}>
          <Text
            className={`font-semibold ${
              loading || uploading || (!content.trim() && !uploadedUrl && !youtubeLink)
                ? "text-gray-500 dark:text-gray-400"
                : "text-white"
            }`}>
            {loading ? "Posting..." : uploading ? "Uploading..." : "Post"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* User Info */}
        <View className="flex-row items-center mb-4">
          <View className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center mr-3">
            {currentUser?.avatar_url ? (
              <Image
                source={{ uri: currentUser.avatar_url }}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <Text className="text-white font-bold text-lg">
                {currentUser?.username?.charAt(0).toUpperCase() || "U"}
              </Text>
            )}
          </View>
          <View>
            <Text className="font-semibold text-gray-900 dark:text-white">
              {currentUser?.full_name || "Your Name"}
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-sm">
              @{currentUser?.username || "your_username"}
            </Text>
          </View>
        </View>

        {/* Content Input */}
        <TextInput
          className="text-gray-900 dark:text-white text-lg leading-6 min-h-[120px]"
          placeholder="What's on your mind?"
          placeholderTextColor="#6b7280"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        {/* Media Preview */}
        {selectedMedia && (
          <View className="mt-4 relative">
            {/* Upload overlay */}
            {uploading && (
              <View className="absolute top-0 left-0 right-0 bottom-0 z-10 bg-black/40 rounded-xl items-center justify-center">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="text-white font-medium mt-2">
                  Uploading {selectedMedia.type}...
                </Text>
              </View>
            )}

            {selectedMedia.type === "video" ? (
              <View>
                <VideoPreview uri={selectedMedia.uri} />
                {/* Video badge */}
                <View className="absolute top-3 left-3 bg-black/60 px-2 py-1 rounded-lg flex-row items-center">
                  <Ionicons name="videocam" size={14} color="white" />
                  {selectedMedia.duration ? (
                    <Text className="text-white text-xs ml-1 font-medium">
                      {formatDuration(selectedMedia.duration)}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : (
              <Image
                source={{ uri: selectedMedia.uri }}
                className="w-full h-64 rounded-xl"
                resizeMode="cover"
              />
            )}

            {/* Remove button */}
            <TouchableOpacity
              onPress={removeMedia}
              className="absolute top-2 right-2 bg-black/60 rounded-full p-2">
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>

            {/* Upload status */}
            {uploadedUrl && (
              <View className="absolute bottom-3 left-3 bg-green-500/80 px-2 py-1 rounded-lg flex-row items-center">
                <Ionicons name="checkmark-circle" size={14} color="white" />
                <Text className="text-white text-xs ml-1 font-medium">
                  Ready to post
                </Text>
              </View>
            )}
          </View>
        )}

        {/* YouTube Preview */}
        {youtubeLink && (
          <View className="mt-4 relative">
            <YouTubeEmbed url={youtubeLink} height={220} />
            <TouchableOpacity
              onPress={removeYouTube}
              className="absolute top-2 right-2 bg-black/60 rounded-full p-2">
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
            <View className="absolute bottom-3 left-3 bg-green-500/80 px-2 py-1 rounded-lg flex-row items-center">
              <Ionicons name="checkmark-circle" size={14} color="white" />
              <Text className="text-white text-xs ml-1 font-medium">
                Ready to post
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Text className="text-gray-600 dark:text-gray-400 font-medium">
            Add to your post
          </Text>
          <View className="flex-row space-x-4">
            <PickImag
              onImageSelected={(asset: MediaAsset) => { removeYouTube(); handleMediaPicker(asset); }}
              className="flex-row items-center"
              avatarUrl={null}
              mediaTypes={["images"]}>
              <Ionicons name="image" size={24} color="#3b82f6" />
            </PickImag>
            <PickImag
              onImageSelected={(asset: MediaAsset) => { removeYouTube(); handleMediaPicker(asset); }}
              className="flex-row items-center"
              avatarUrl={null}
              mediaTypes={["videos"]}>
              <Ionicons name="videocam" size={24} color="#8b5cf6" />
            </PickImag>
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => setYoutubeModalVisible(true)}>
              <Ionicons name="logo-youtube" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* YouTube URL Modal */}
        <Modal visible={youtubeModalVisible} transparent animationType="fade">
          <View className="flex-1 bg-black/50 justify-center items-center px-6">
            <View className="bg-white dark:bg-gray-800 w-full rounded-2xl p-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-gray-900 dark:text-white">
                  Add YouTube Video
                </Text>
                <TouchableOpacity onPress={() => { setYoutubeModalVisible(false); setYoutubeUrl(""); }}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-3 mb-4">
                <Ionicons name="link" size={20} color="#6b7280" />
                <TextInput
                  className="flex-1 ml-3 text-gray-900 dark:text-white text-base"
                  placeholder="Paste YouTube link here..."
                  placeholderTextColor="#9ca3af"
                  value={youtubeUrl}
                  onChangeText={setYoutubeUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>

              {/* Live preview */}
              {youtubeUrl.trim() && isYouTubeUrl(youtubeUrl.trim()) && (
                <View className="mb-4">
                  <YouTubeEmbed url={youtubeUrl.trim()} height={180} />
                </View>
              )}

              <TouchableOpacity
                className="bg-red-500 py-3 rounded-xl items-center"
                onPress={handleYouTubeAdd}>
                <View className="flex-row items-center">
                  <Ionicons name="logo-youtube" size={20} color="white" />
                  <Text className="text-white font-semibold text-base ml-2">
                    Add Video
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper to handle Windows paths
const fixUri = (uri: string) => {
  if (uri.startsWith('C:') || uri.startsWith('D:')) {
    return `file:///${uri.replace(/\\/g, '/')}`;
  }
  return uri;
};

function VideoPreview({ uri }: { uri: string }) {
  const fixedUri = fixUri(uri);
  const html = `<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>*{margin:0;padding:0;background:#000;} video{width:100%;height:100vh;object-fit:contain;}</style>
  </head><body>
    <video src="${fixedUri}" controls autoplay playsinline loop></video>
  </body></html>`;

  return (
    <WebView
      source={{ html }}
      style={{ width: '100%', height: 256, borderRadius: 12 }}
      javaScriptEnabled
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      scrollEnabled={false}
    />
  );
}
