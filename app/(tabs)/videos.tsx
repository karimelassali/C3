import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  Image,
  Dimensions,
  StyleSheet,
} from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import {
  getPosts,
  likePost,
  unlikePost,
} from "../../lib/supabase";

interface Post {
  id: string;
  content: string;
  image_url?: string;
  media_type?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
    verified: boolean;
  } | null;
  likes_count?: number;
  is_liked?: boolean;
  comments_count?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const VIDEO_HEIGHT = SCREEN_HEIGHT - 200;

export default function VideosScreen() {
  const { colors } = useTheme();
  const [videoPosts, setVideoPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadVideoPosts();
    }, [])
  );

  const loadVideoPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await getPosts();
      if (error) {
        console.error("Error loading video posts:", error);
      } else {
        // Include both uploaded videos and YouTube links
        const videos = (data || []).filter(
          (post: Post) =>
            (post.media_type === "video" || post.media_type === "youtube") &&
            post.image_url
        );
        setVideoPosts(videos);
      }
    } catch (error) {
      console.error("Error in loadVideoPosts:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVideoPosts();
    setRefreshing(false);
  };

  const handleLike = async (postId: string) => {
    try {
      const post = videoPosts.find((p) => p.id === postId);
      if (!post) return;

      if (post.is_liked) {
        const { error } = await unlikePost(postId);
        if (!error) {
          setVideoPosts((prev) =>
            prev.map((p) =>
              p.id === postId
                ? { ...p, is_liked: false, likes_count: (p.likes_count || 1) - 1 }
                : p
            )
          );
        }
      } else {
        const { error } = await likePost(postId);
        if (!error) {
          setVideoPosts((prev) =>
            prev.map((p) =>
              p.id === postId
                ? { ...p, is_liked: true, likes_count: (p.likes_count || 0) + 1 }
                : p
            )
          );
        }
      }
    } catch (error) {
      console.error("Error handling like:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60)
      );
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  /** Build a self-contained HTML page that plays an mp4 or embeds a YouTube video */
  const buildVideoHtml = (url: string, isYoutube: boolean) => {
    if (isYoutube) {
      // Extract YouTube video ID
      const match = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
      );
      const videoId = match?.[1] ?? "";
      return `<!DOCTYPE html><html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>*{margin:0;padding:0;background:#000;} iframe{width:100%;height:100vh;border:none;}</style>
      </head><body>
        <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1"
          allow="autoplay; fullscreen" allowfullscreen></iframe>
      </body></html>`;
    }
    // Native mp4 via HTML5 video
    return `<!DOCTYPE html><html><head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>*{margin:0;padding:0;background:#000;} video{width:100%;height:100vh;object-fit:contain;}</style>
    </head><body>
      <video src="${url}" controls playsinline autoplay loop></video>
    </body></html>`;
  };

  const renderVideoPost = ({ item }: { item: Post }) => {
    const isYoutube = item.media_type === "youtube";

    return (
      <View style={[styles.slide, { backgroundColor: "#000" }]}>
        {/* Video via WebView — works universally in Expo Go */}
        <WebView
          source={{ html: buildVideoHtml(item.image_url!, isYoutube) }}
          style={styles.webview}
          javaScriptEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          scrollEnabled={false}
          allowsFullscreenVideo
        />

        {/* Overlay — User Info */}
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.userRow}
            onPress={() => router.push(`/user-profile/${item.user_id}`)}>
            <View style={styles.avatar}>
              {item.profiles?.avatar_url ? (
                <Image
                  source={{ uri: item.profiles.avatar_url }}
                  style={styles.avatarImg}
                />
              ) : (
                <Text style={styles.avatarInitial}>
                  {item.profiles?.username?.charAt(0).toUpperCase() || "U"}
                </Text>
              )}
            </View>
            <View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.username}>
                  {item.profiles?.full_name || item.profiles?.username || "Unknown"}
                </Text>
                {item.profiles?.verified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color="#3b82f6"
                    style={{ marginLeft: 4 }}
                  />
                )}
              </View>
              <Text style={styles.date}>{formatDate(item.created_at)}</Text>
            </View>
          </TouchableOpacity>

          {/* Content */}
          {item.content ? (
            <Text style={styles.content} numberOfLines={2}>
              {item.content}
            </Text>
          ) : null}
        </View>

        {/* Media type badge */}
        <View style={[styles.badge, isYoutube ? styles.badgeYT : styles.badgeVideo]}>
          <Ionicons
            name={isYoutube ? "logo-youtube" : "videocam"}
            size={12}
            color="white"
          />
          <Text style={styles.badgeText}>
            {isYoutube ? "YouTube" : "Video"}
          </Text>
        </View>

        {/* Side Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleLike(item.id)}>
            <View style={styles.actionCircle}>
              <Ionicons
                name={item.is_liked ? "heart" : "heart-outline"}
                size={26}
                color={item.is_liked ? "#ef4444" : "white"}
              />
            </View>
            <Text style={styles.actionCount}>{item.likes_count || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <View style={styles.actionCircle}>
              <Ionicons name="chatbubble-outline" size={24} color="white" />
            </View>
            <Text style={styles.actionCount}>{item.comments_count || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Videos</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/create")}>
          <Ionicons name="add-circle-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {videoPosts.length === 0 && !loading ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="videocam-outline" size={40} color="#6b7280" />
          </View>
          <Text style={styles.emptyTitle}>No videos yet</Text>
          <Text style={styles.emptySubtitle}>
            Videos and YouTube links from you and your friends will appear here
          </Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push("/(tabs)/create")}>
            <Text style={styles.createBtnText}>Create a Video Post</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={videoPosts}
          renderItem={renderVideoPost}
          keyExtractor={(item) => item.id}
          pagingEnabled
          decelerationRate="fast"
          snapToInterval={VIDEO_HEIGHT}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="white"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  slide: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
  },
  webview: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    position: "absolute",
    bottom: 60,
    left: 16,
    right: 70,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarInitial: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  username: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },
  date: {
    color: "#d1d5db",
    fontSize: 12,
  },
  content: {
    color: "white",
    fontSize: 14,
    lineHeight: 20,
  },
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeYT: {
    backgroundColor: "rgba(239,0,0,0.85)",
  },
  badgeVideo: {
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  badgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
  actions: {
    position: "absolute",
    right: 12,
    bottom: 70,
    alignItems: "center",
  },
  actionBtn: {
    alignItems: "center",
    marginBottom: 20,
  },
  actionCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionCount: {
    color: "white",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1f2937",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    color: "#9ca3af",
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtitle: {
    color: "#6b7280",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  createBtn: {
    marginTop: 24,
    backgroundColor: "#3b82f6",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
  },
  createBtnText: {
    color: "white",
    fontWeight: "600",
  },
});