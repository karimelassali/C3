import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";
import {
  acceptFriendRequest,
  getPendingFriendRequests,
  rejectFriendRequest,
} from "../lib/supabase";

interface PendingRequest {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  created_at?: string;
}

export default function FriendRequestsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await getPendingFriendRequests();
      if (error) {
        console.error("Error loading pending requests:", error);
        Alert.alert("Error", "Failed to load friend requests");
      } else {
        setRequests(data || []);
      }
    } catch (error) {
      console.error("Error in loadRequests:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleAccept = async (senderId: string, name: string) => {
    try {
      setActionLoading(senderId);
      const { error } = await acceptFriendRequest(senderId);
      if (error) {
        Alert.alert("Error", "Failed to accept request");
      } else {
        setRequests((prev) => prev.filter((r) => r.id !== senderId));
        Alert.alert("Success", `You are now friends with ${name}`);
      }
    } catch (error) {
      console.error("Error accepting request:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (senderId: string) => {
    try {
      setActionLoading(senderId);
      const { error } = await rejectFriendRequest(senderId);
      if (error) {
        Alert.alert("Error", "Failed to ignore request");
      } else {
        setRequests((prev) => prev.filter((r) => r.id !== senderId));
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const renderItem = ({ item }: { item: PendingRequest }) => {
    const isThisActionLoading = actionLoading === item.id;

    return (
      <View
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        className="flex-row items-center p-4 mb-3 mx-4 rounded-3xl border shadow-sm"
      >
        {/* Avatar */}
        <TouchableOpacity 
          onPress={() => router.push(`/user-profile/${item.id}`)}
          className="relative"
        >
          <View 
            style={{ backgroundColor: colors.primary + '20' }}
            className="w-16 h-16 rounded-full items-center justify-center overflow-hidden"
          >
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} className="w-full h-full" />
            ) : (
              <Text style={{ color: colors.primary }} className="text-xl font-bold">
                {item.username?.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Info & Buttons */}
        <View className="flex-1 ml-4">
          <View className="mb-3">
            <Text style={{ color: colors.text }} className="text-lg font-bold">
              {item.full_name || item.username}
            </Text>
            <Text style={{ color: colors.textSecondary }} className="text-sm">
              @{item.username} wants to be your friend
            </Text>
          </View>

          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={() => handleAccept(item.id, item.full_name || item.username)}
              disabled={!!actionLoading}
              style={{ backgroundColor: colors.primary }}
              className="flex-1 py-3 rounded-2xl items-center justify-center shadow-md"
            >
              {isThisActionLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-bold">Accept</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleReject(item.id)}
              disabled={!!actionLoading}
              style={{ backgroundColor: colors.border }}
              className="flex-1 py-3 rounded-2xl items-center justify-center"
            >
              <Text style={{ color: colors.text }} className="font-semibold">Ignore</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ backgroundColor: colors.background }} className="flex-1">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{ backgroundColor: colors.surface }}
            className="p-2 rounded-2xl mr-4 shadow-sm"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ color: colors.text }} className="text-2xl font-bold">
            Friend Requests
          </Text>
        </View>
        {requests.length > 0 && (
          <View className="bg-red-500 px-3 py-1 rounded-full">
            <Text className="text-white font-bold text-xs">{requests.length}</Text>
          </View>
        )}
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary }} className="mt-4 text-base">
            Loading requests...
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 10 }}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20 px-10">
              <View 
                style={{ backgroundColor: colors.surface }}
                className="w-24 h-24 rounded-full items-center justify-center mb-6 shadow-sm"
              >
                <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
              </View>
              <Text style={{ color: colors.text }} className="text-xl font-bold text-center">
                No pending requests
              </Text>
              <Text style={{ color: colors.textSecondary }} className="text-center mt-2 text-base">
                When people send you friend requests, they'll show up here.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/search')}
                style={{ backgroundColor: colors.primary }}
                className="mt-8 px-8 py-4 rounded-3xl shadow-lg"
              >
                <Text className="text-white font-bold text-base">Find Friends</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
