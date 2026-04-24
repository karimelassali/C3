import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert } from 'react-native';
import { TouchableOpacity } from 'react-native';

export default function PickImag({ className, avatarUrl, onImageSelected, mediaTypes, children }) {
    const [image, setImage] = useState(avatarUrl);

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert('Permission required', 'Permission to access the media library is required.');
            return;
        }

        // Support both images and videos by default
        const allowedTypes = mediaTypes || ['images', 'videos'];

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: allowedTypes,
            allowsEditing: allowedTypes.includes('videos') ? false : true,
            aspect: [5, 5],
            quality: 0.8,
            videoMaxDuration: 60,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            setImage(asset.uri);
            // Pass full asset info (uri, type, duration, etc.)
            onImageSelected({
                uri: asset.uri,
                type: asset.type || 'image', // 'image' or 'video'
                duration: asset.duration || 0,
                width: asset.width,
                height: asset.height,
                fileName: asset.fileName,
            });
        }
    };

    return (
        <TouchableOpacity onPress={pickImage} className={className}>
            {children}
        </TouchableOpacity>
    );
}