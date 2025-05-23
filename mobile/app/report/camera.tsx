import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions, CameraType, FlashMode } from 'expo-camera';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PanResponder } from 'react-native';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [type, setType] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const cameraRef = useRef(null);
  const router = useRouter();

  const toggleFlash = () => {
    setFlash((prev) => (prev === 'off' ? 'on' : 'off'));
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 20; 
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          router.back();
        }
      },
    })
  ).current;

  const flipCamera = () => {
    setType((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
      router.push({
        pathname: '/report/preview',
        params: { imageUri: photo.uri },
      });
    }
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need camera access to take pictures.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={type}
        flash={flash}
      />

      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity onPress={toggleFlash} style={styles.iconButton}>
          <Text style={styles.iconText}>{flash === 'off' ? '⚡ Off' : '⚡ On'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={flipCamera} style={styles.iconButton}>
          <Text style={styles.iconText}>🔁 Flip</Text>
        </TouchableOpacity>
      </View>

      {/* Capture Button */}
      <View style={styles.bottomControls}>
        <TouchableOpacity onPress={takePicture} style={styles.captureButton}>
          <Text style={styles.captureText}>📸</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  iconButton: {
    backgroundColor: '#ffffffcc',
    padding: 10,
    borderRadius: 8,
  },
  iconText: {
    fontSize: 16,
    fontWeight: '500',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 50,
  },
  captureText: {
    fontSize: 24,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
