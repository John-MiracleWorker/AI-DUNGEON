import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

interface SaveGameModalProps {
  visible: boolean;
  onClose: () => void;
  /**
   * Callback invoked when the user submits a save name.
   * Should return true if the save was successful, false otherwise.
   */
  onSave: (saveName: string) => Promise<boolean> | boolean;
  isSaving?: boolean;
}

export const SaveGameModal: React.FC<SaveGameModalProps> = ({
  visible,
  onClose,
  onSave,
  isSaving = false,
}) => {
  const [saveName, setSaveName] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!saveName.trim()) {
      setError('Please enter a valid save name');
      return;
    }

    const success = await onSave(saveName.trim());
    if (success) {
      setSaveName('');
      setError('');
      onClose();
    }
  };

  const handleCancel = () => {
    setSaveName('');
    setError('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Save Game</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter save name"
            placeholderTextColor="#9ca3af"
            value={saveName}
            onChangeText={(text) => {
              setSaveName(text);
              if (error) setError('');
            }}
            autoFocus
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isSaving}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1f2937',
    color: '#ffffff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: {
    color: '#ef4444',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#6b7280',
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
  },
});

export default SaveGameModal;

