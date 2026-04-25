import { useState, useEffect } from "react";
import { View, Text, FlatList, TextInput, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getFriends } from "../../lib/supabase";

export default function ChatScreen() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const { data, error } = await getFriends();
      if (error) {
        console.error("Error fetching friends:", error);
      } else {
        setFriends(data || []);
      }
    } catch (err) {
      console.error("Exception fetching friends:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-900 px-4 pt-12">
      {/* 🔍 Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-white text-2xl font-bold">Chats</Text>
        <TouchableOpacity onPress={fetchFriends}>
          <Ionicons name="refresh-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* 🔎 Search */}
      <View className="flex-row items-center bg-slate-800 rounded-xl px-3 py-2 mb-4">
        <Ionicons name="search" size={18} color="#9ca3af" />
        <TextInput
          placeholder="Search..."
          placeholderTextColor="#9ca3af"
          className="ml-2 text-white flex-1"
        />
      </View>

      {/* 💬 Contacts List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity className="flex-row items-center py-3 border-b border-slate-800">
              {/* Avatar */}
              <View className="relative">
                <Image
                  source={{ 
                    uri: item.avatar_url || `https://ui-avatars.com/api/?name=${item.username || 'User'}&background=random` 
                  }}
                  className="w-14 h-14 rounded-full"
                />
                {/* Status indicator (hardcoded for now as Supabase profile doesn't have online status yet) */}
                <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
              </View>

              {/* Info */}
              <View className="flex-1 ml-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-white text-base font-semibold">
                    {item.full_name || item.username || "Unknown User"}
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    Just now
                  </Text>
                </View>
                <Text className="text-gray-400 text-sm mt-1" numberOfLines={1}>
                  @{item.username}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="mt-10 items-center">
              <Text className="text-gray-400">No friends found yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}