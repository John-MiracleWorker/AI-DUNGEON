import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';
import { 
  updateCharacters,
  addNPC,
  updateNPC,
  removeNPC,
  selectCurrentAdventure 
} from '../../store/customAdventureSlice';

interface NPCFormData {
  name: string;
  description: string;
  relationship: string;
  personality?: string;
  goals?: string;
}

export const CharacterStep: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentAdventure = useAppSelector(selectCurrentAdventure);
  
  const [isNPCModalVisible, setIsNPCModalVisible] = useState(false);
  const [editingNPCIndex, setEditingNPCIndex] = useState<number | null>(null);
  const [npcForm, setNPCForm] = useState<NPCFormData>({
    name: '',
    description: '',
    relationship: '',
    personality: '',
    goals: '',
  });

  const characters = currentAdventure?.characters || {
    player_role: '',
    key_npcs: [],
    relationships: []
  };

  const handlePlayerRoleChange = (value: string) => {
    dispatch(updateCharacters({ player_role: value }));
  };

  const openNPCModal = (index?: number) => {
    if (index !== undefined) {
      const npc = characters.key_npcs[index];
      setNPCForm({
        name: npc.name,
        description: npc.description,
        relationship: npc.relationship,
        personality: npc.personality || '',
        goals: npc.goals || '',
      });
      setEditingNPCIndex(index);
    } else {
      setNPCForm({
        name: '',
        description: '',
        relationship: '',
        personality: '',
        goals: '',
      });
      setEditingNPCIndex(null);
    }
    setIsNPCModalVisible(true);
  };

  const closeNPCModal = () => {
    setIsNPCModalVisible(false);
    setEditingNPCIndex(null);
    setNPCForm({
      name: '',
      description: '',
      relationship: '',
      personality: '',
      goals: '',
    });
  };

  const saveNPC = () => {
    if (!npcForm.name.trim() || !npcForm.description.trim() || !npcForm.relationship.trim()) {
      Alert.alert('Missing Information', 'Please fill in name, description, and relationship fields.');
      return;
    }

    if (editingNPCIndex !== null) {
      dispatch(updateNPC({ index: editingNPCIndex, npc: npcForm }));
    } else {
      dispatch(addNPC(npcForm));
    }

    closeNPCModal();
  };

  const handleRemoveNPC = (index: number, npcName: string) => {
    Alert.alert(
      'Remove NPC',
      `Are you sure you want to remove "${npcName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => dispatch(removeNPC(index))
        }
      ]
    );
  };

  const NPCModal = () => (
    <Modal
      visible={isNPCModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeNPCModal}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={closeNPCModal}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingNPCIndex !== null ? 'Edit NPC' : 'Add New NPC'}
          </Text>
          <TouchableOpacity onPress={saveNPC}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Name *</Text>
            <TextInput
              style={styles.modalInput}
              value={npcForm.name}
              onChangeText={(text) => setNPCForm({ ...npcForm, name: text })}
              placeholder="Character name"
              placeholderTextColor="#6b7280"
              maxLength={100}
            />
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Description *</Text>
            <TextInput
              style={styles.modalTextArea}
              value={npcForm.description}
              onChangeText={(text) => setNPCForm({ ...npcForm, description: text })}
              placeholder="Physical appearance, background, and key traits"
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Relationship to Player *</Text>
            <TextInput
              style={styles.modalInput}
              value={npcForm.relationship}
              onChangeText={(text) => setNPCForm({ ...npcForm, relationship: text })}
              placeholder="Ally, enemy, mentor, stranger, etc."
              placeholderTextColor="#6b7280"
              maxLength={200}
            />
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Personality (Optional)</Text>
            <TextInput
              style={styles.modalTextArea}
              value={npcForm.personality}
              onChangeText={(text) => setNPCForm({ ...npcForm, personality: text })}
              placeholder="Personality traits, quirks, speech patterns"
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={3}
              maxLength={300}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Goals & Motivations (Optional)</Text>
            <TextInput
              style={styles.modalTextArea}
              value={npcForm.goals}
              onChangeText={(text) => setNPCForm({ ...npcForm, goals: text })}
              placeholder="What does this character want? What drives them?"
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={3}
              maxLength={300}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Player Character</Text>
        <Text style={styles.sectionDescription}>
          Describe the role and background of the player character in this adventure
        </Text>
        
        <TextInput
          style={styles.textArea}
          value={characters.player_role}
          onChangeText={handlePlayerRoleChange}
          placeholder="A brave knight seeking redemption, a cunning rogue with a mysterious past, a scholar investigating ancient mysteries..."
          placeholderTextColor="#6b7280"
          multiline
          numberOfLines={4}
          maxLength={300}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>
          {characters.player_role.length}/300
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Key NPCs</Text>
            <Text style={styles.sectionDescription}>
              Add important characters that will interact with the player
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => openNPCModal()}
          >
            <Ionicons name="add" size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>Add NPC</Text>
          </TouchableOpacity>
        </View>

        {characters.key_npcs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#6b7280" />
            <Text style={styles.emptyStateTitle}>No NPCs Added Yet</Text>
            <Text style={styles.emptyStateText}>
              Add some key characters to make your adventure more engaging
            </Text>
          </View>
        ) : (
          <View style={styles.npcList}>
            {characters.key_npcs.map((npc, index) => (
              <View key={index} style={styles.npcCard}>
                <View style={styles.npcHeader}>
                  <Text style={styles.npcName}>{npc.name}</Text>
                  <View style={styles.npcActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openNPCModal(index)}
                    >
                      <Ionicons name="pencil" size={16} color="#6b46c1" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveNPC(index, npc.name)}
                    >
                      <Ionicons name="trash" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <Text style={styles.npcDescription}>{npc.description}</Text>
                
                <View style={styles.npcMeta}>
                  <View style={styles.npcMetaItem}>
                    <Text style={styles.npcMetaLabel}>Relationship:</Text>
                    <Text style={styles.npcMetaValue}>{npc.relationship}</Text>
                  </View>
                  {npc.personality && (
                    <View style={styles.npcMetaItem}>
                      <Text style={styles.npcMetaLabel}>Personality:</Text>
                      <Text style={styles.npcMetaValue}>{npc.personality}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Character Tips</Text>
        <View style={styles.tipsContainer}>
          <View style={styles.tip}>
            <Ionicons name="bulb" size={16} color="#fbbf24" />
            <Text style={styles.tipText}>
              Give NPCs clear motivations and goals that can create interesting conflicts
            </Text>
          </View>
          <View style={styles.tip}>
            <Ionicons name="bulb" size={16} color="#fbbf24" />
            <Text style={styles.tipText}>
              Mix allies and adversaries to create dynamic relationships
            </Text>
          </View>
          <View style={styles.tip}>
            <Ionicons name="bulb" size={16} color="#fbbf24" />
            <Text style={styles.tipText}>
              Consider how each NPC can help or hinder the main objective
            </Text>
          </View>
        </View>
      </View>

      <NPCModal />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f3f4f6',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  textArea: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#f3f4f6',
    minHeight: 100,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  addButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f3f4f6',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  npcList: {
    gap: 16,
  },
  npcCard: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  npcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  npcName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f3f4f6',
  },
  npcActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
  },
  removeButton: {
    padding: 8,
  },
  npcDescription: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    marginBottom: 12,
  },
  npcMeta: {
    gap: 8,
  },
  npcMetaItem: {
    flexDirection: 'row',
    gap: 8,
  },
  npcMetaLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
    minWidth: 80,
  },
  npcMetaValue: {
    flex: 1,
    fontSize: 12,
    color: '#d1d5db',
  },
  tipsContainer: {
    gap: 12,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f3f4f6',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#f3f4f6',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#f3f4f6',
  },
  modalTextArea: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#f3f4f6',
    minHeight: 100,
  },
});

export default CharacterStep;