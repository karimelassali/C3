import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../lib/supabase";
import { useTheme } from "../../../contexts/ThemeContext";
import { useAuth } from "../../../contexts/AuthContext";

export default function ChatScreen() {
  const { cid } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const [friend, setFriend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]); // Mock messages for UI for now
  
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchFriendProfile();
    // In a real app, you would fetch messages here from a 'messages' table
    stubMessages();
  }, [cid]);

  const fetchFriendProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", cid)
        .single();

      if (!error) {
        setFriend(data);
      }
    } catch (err) {
      console.error("Error fetching friend profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const stubMessages = () => {
    setMessages([
      { id: '1', text: "Hey! How's it going?", senderId: cid, time: '10:00 AM' },
      { id: '2', text: "I'm doing great, working on the new Whispr app features!", senderId: currentUser?.id, time: '10:02 AM' },
      { id: '3', text: "That looks amazing! Can't wait to see the final version. 🔥", senderId: cid, time: '10:05 AM' },
      { id: '4', text: "Actually, look at this new chat UI we just built together.", senderId: currentUser?.id, time: '10:06 AM' },
    ]);
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: message.trim(),
      senderId: currentUser?.id,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === currentUser?.id;

    return (
        
      <View
        className={`flex-row mb-4 ${isMe ? "justify-end" : "justify-start"}`}
      >
        {!isMe && (
          <Image
            source={{ uri: friend?.avatar_url || `https://ui-avatars.com/api/?name=${friend?.username || 'U'}&background=random` }}
            className="w-8 h-8 rounded-full self-end mr-2 mb-1"
          />
        )}
        <View
          style={{
            backgroundColor: isMe ? colors.primary : colors.surface,
            borderBottomRightRadius: isMe ? 4 : 20,
            borderBottomLeftRadius: isMe ? 20 : 4,
            maxWidth: '75%',
          }}
          className="px-4 py-3 rounded-2xl shadow-sm"
        >
          <Text
            style={{ color: isMe ? "#FFFFFF" : colors.text }}
            className="text-base"
          >
            {item.text}
          </Text>
          <Text
            style={{ color: isMe ? "rgba(255,255,255,0.7)" : colors.textSecondary }}
            className="text-[10px] mt-1 self-end"
          >
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ backgroundColor: colors.background }} className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ backgroundColor: colors.background }} className="flex-1">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View 
        style={{ borderBottomColor: colors.border }}
        className="flex-row items-center px-4 py-3 border-b"
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View className="flex-row items-center flex-1">
          <View className="relative">
            <Image
              source={{ uri: friend?.avatar_url || `https://ui-avatars.com/api/?name=${friend?.username || 'U'}&background=random` }}
              className="w-10 h-10 rounded-full"
            />
            <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
          </View>
          
          <View className="ml-3">
            <Text style={{ color: colors.text }} className="font-bold text-base">
              {friend?.full_name || friend?.username || "Unknown"}
            </Text>
            <Text style={{ color: colors.success }} className="text-xs">
              Online
            </Text>
          </View>
        </View>

        <View className="flex-row gap-4">
          <TouchableOpacity>
            <Ionicons name="call-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="videocam-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View 
          style={{ backgroundColor: colors.surface, borderTopColor: colors.border }}
          className="flex-row items-center px-4 py-3 border-t"
        >
          <TouchableOpacity className="mr-3">
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
          
          <View 
            style={{ backgroundColor: colors.background }}
            className="flex-1 flex-row items-center rounded-3xl px-4 py-2 mr-3"
          >
            <TextInput
              placeholder="Type a message..."
              placeholderTextColor={colors.textSecondary}
              style={{ color: colors.text }}
              className="flex-1 text-base max-h-24"
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <TouchableOpacity>
              <Ionicons name="happy-outline" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={sendMessage}
            style={{ 
              backgroundColor: message.trim() ? colors.primary : colors.border,
              padding: 10,
              borderRadius: 25,
            }}
            disabled={!message.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={message.trim() ? "white" : colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}