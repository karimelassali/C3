import { useState, useEffect } from "react";
import { View, Text, FlatList, TextInput, Image, TouchableOpacity, ActivityIndicator, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getFriends } from "../../../lib/supabase";
import { useTheme } from "../../../contexts/ThemeContext";

export default function ChatScreen() {
  const { colors } = useTheme();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleChatPress = (friendId) => {
    router.push(`/chat/${friendId}`);
  };

  const filteredFriends = friends.filter(f => 
    (f.full_name || f.username || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={{ backgroundColor: colors.background }} className="flex-1">
      <View className="flex-1 px-4 pt-4">
        {/* 🔍 Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text style={{ color: colors.text }} className="text-3xl font-bold">Messages</Text>
          <TouchableOpacity 
            onPress={fetchFriends}
            style={{ backgroundColor: colors.surface }}
            className="p-2 rounded-full shadow-sm"
          >
            <Ionicons name="refresh-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* 🔎 Search */}
        <View 
          style={{ backgroundColor: colors.surface }}
          className="flex-row items-center rounded-2xl px-4 py-3 mb-6 shadow-sm"
        >
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            placeholder="Search friends..."
            placeholderTextColor={colors.textSecondary}
            style={{ color: colors.text }}
            className="ml-3 flex-1 text-base"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* 💬 Contacts List */}
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredFriends}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                onPress={() => handleChatPress(item.id)} 
                className="flex-row items-center py-4 mb-2"
              >
                {/* Avatar */}
                <View className="relative">
                  <Image
                    source={{ 
                      uri: item.avatar_url || `https://ui-avatars.com/api/?name=${item.username || 'User'}&background=random` 
                    }}
                    className="w-16 h-16 rounded-full"
                  />
                  <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" style={{ borderColor: colors.background }} />
                </View>

                {/* Info */}
                <View className="flex-1 ml-4 border-b pb-4" style={{ borderBottomColor: colors.border }}>
                  <View className="flex-row justify-between items-center mb-1">
                    <Text style={{ color: colors.text }} className="text-lg font-bold">
                      {item.full_name || item.username || "Unknown User"}
                    </Text>
                    <Text style={{ color: colors.textSecondary }} className="text-xs">
                      Just now
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text style={{ color: colors.textSecondary }} className="text-sm flex-1 mr-2" numberOfLines={1}>
                      @{item.username}
                    </Text>
                    {/* Mock unread badge */}
                    <View style={{ backgroundColor: colors.primary }} className="w-5 h-5 rounded-full items-center justify-center">
                      <Text className="text-white text-[10px] font-bold">1</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View className="mt-20 items-center px-10">
                <Ionicons name="chatbubbles-outline" size={64} color={colors.border} />
                <Text style={{ color: colors.text }} className="text-xl font-bold mt-4">No conversations yet</Text>
                <Text style={{ color: colors.textSecondary }} className="text-center mt-2">
                  When you start chatting with your friends, they will appear here.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}