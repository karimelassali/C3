import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Button, Image, View } from 'react-native';
import { TouchableOpacity } from 'react-native';


export default function PickImag({ className, avatarUrl, onImageSelected, children }) {
    const [image, setImage] = useState(avatarUrl);


    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert('Permission required', 'Permission to access the media library is required.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: true,
            aspect: [5, 5],
            quality: 1,


        });

        console.log(result);

        if (!result.canceled) {
            setImage(result.assets[0].uri);
            onImageSelected(result.assets[0].uri);

        }
    };

    return (
        <TouchableOpacity onPress={pickImage} className={className}>
            {children}
        </TouchableOpacity>
    );

}