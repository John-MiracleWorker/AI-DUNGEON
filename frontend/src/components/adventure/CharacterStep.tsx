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
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';
import { 
  updateCharacters,
  addNPC,
  updateNPC,
  removeNPC,
  addNPCRelationship,
  removeNPCRelationship,
  selectCurrentAdventure 
} from '../../store/customAdventureSlice';
import { NPCTemplate } from '../../../../shared/types';
import { NPC_TEMPLATES, getNPCTemplatesByCategory, getAllCategories } from '../../../../shared/npcTemplates';

interface NPCFormData {
  id?: string;
  name: string;
  description: string;
  relationship: string;
  personality?: string;
  goals?: string;
  traits: string[];
  backstory?: string;
  importance: 'major' | 'minor' | 'background';
  templateId?: string;
}

interface RelationshipFormData {
  targetNpcId: string;
  type: 'ally' | 'enemy' | 'neutral' | 'family' | 'romantic' | 'rival';
  description: string;
  strength: number;
}

export const CharacterStep: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentAdventure = useAppSelector(selectCurrentAdventure);
  
  const [isNPCModalVisible, setIsNPCModalVisible] = useState(false);
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
  const [isRelationshipModalVisible, setIsRelationshipModalVisible] = useState(false);
  const [editingNPCIndex, setEditingNPCIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('fantasy');
  const [currentNPCId, setCurrentNPCId] = useState<string | null>(null);
  const [npcForm, setNPCForm] = useState<NPCFormData>({
    name: '',
    description: '',
    relationship: '',
    personality: '',
    goals: '',
    traits: [],
    backstory: '',
    importance: 'minor',
    templateId: undefined
  });
  const [relationshipForm, setRelationshipForm] = useState<RelationshipFormData>({
    targetNpcId: '',
    type: 'neutral',
    description: '',
    strength: 5
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
        id: npc.id,
        name: npc.name,
        description: npc.description,
        relationship: npc.relationship,
        personality: npc.personality || '',
        goals: npc.goals || '',
        traits: npc.traits || [],
        backstory: npc.backstory || '',
        importance: npc.importance || 'minor',
        templateId: npc.templateId
      });
      setEditingNPCIndex(index);
    } else {
      setNPCForm({
        name: '',
        description: '',
        relationship: '',
        personality: '',
        goals: '',
        traits: [],
        backstory: '',
        importance: 'minor',
        templateId: undefined
      });
      setEditingNPCIndex(null);
    }
    setIsNPCModalVisible(true);
  };

  const openTemplateModal = () => {
    setIsTemplateModalVisible(true);
  };

  const applyTemplate = (template: NPCTemplate) => {
    setNPCForm({
      ...npcForm,
      name: template.name,
      description: template.description,
      personality: template.personality,
      goals: template.goals,
      traits: [...template.traits],
      templateId: template.id,
      importance: 'major' // Templates usually represent important characters
    });
    setIsTemplateModalVisible(false);
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
      traits: [],
      backstory: '',
      importance: 'minor',
      templateId: undefined
    });
  };

  const saveNPC = () => {
    if (!npcForm.name.trim() || !npcForm.description.trim() || !npcForm.relationship.trim()) {
      Alert.alert('Missing Information', 'Please fill in name, description, and relationship fields.');
      return;
    }

    const npcData = {
      ...npcForm,
      traits: npcForm.traits || [],
      relationships: [] // Initialize empty relationships
    };

    if (editingNPCIndex !== null) {
      dispatch(updateNPC({ index: editingNPCIndex, npc: npcData }));
    } else {
      dispatch(addNPC(npcData));
    }

    closeNPCModal();
  };

  const openRelationshipModal = (npcId: string) => {
    setCurrentNPCId(npcId);
    setRelationshipForm({
      targetNpcId: '',
      type: 'neutral',
      description: '',
      strength: 5
    });
    setIsRelationshipModalVisible(true);
  };

  const saveRelationship = () => {
    if (!currentNPCId || !relationshipForm.targetNpcId || !relationshipForm.description.trim()) {
      Alert.alert('Missing Information', 'Please select a target NPC and provide a description.');
      return;
    }

    dispatch(addNPCRelationship({
      sourceNpcId: currentNPCId,
      ...relationshipForm
    }));

    setIsRelationshipModalVisible(false);
    setCurrentNPCId(null);
  };

  const removeRelationship = (sourceNpcId: string, targetNpcId: string) => {
    dispatch(removeNPCRelationship({ sourceNpcId, targetNpcId }));
  };

  const addTrait = (trait: string) => {
    if (trait.trim() && !npcForm.traits.includes(trait.trim())) {
      setNPCForm({
        ...npcForm,
        traits: [...npcForm.traits, trait.trim()]
      });
    }
  };

  const removeTrait = (index: number) => {
    const newTraits = [...npcForm.traits];
    newTraits.splice(index, 1);
    setNPCForm({ ...npcForm, traits: newTraits });
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

  const NPCTemplateModal = () => (
    <Modal
      visible={isTemplateModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setIsTemplateModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setIsTemplateModalVisible(false)}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>NPC Templates</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.templateCategories}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {getAllCategories().map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.categoryButtonTextActive
                ]}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={getNPCTemplatesByCategory(selectedCategory)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.templateCard}
              onPress={() => applyTemplate(item)}
            >
              <View style={styles.templateHeader}>
                <Text style={styles.templateName}>{item.name}</Text>
                <Text style={styles.templateArchetype}>{item.archetype}</Text>
              </View>
              <Text style={styles.templateDescription}>{item.description}</Text>
              <Text style={styles.templatePersonality}>Personality: {item.personality}</Text>
              <View style={styles.templateTraits}>
                {item.traits.slice(0, 3).map((trait, index) => (
                  <View key={index} style={styles.traitTag}>
                    <Text style={styles.traitText}>{trait}</Text>
                  </View>
                ))}
                {item.traits.length > 3 && (
                  <Text style={styles.traitMore}>+{item.traits.length - 3} more</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.templateList}
        />
      </View>
    </Modal>
  );

  const RelationshipModal = () => {
    const currentNPC = characters.key_npcs.find(npc => npc.id === currentNPCId);
    const availableNPCs = characters.key_npcs.filter(npc => npc.id !== currentNPCId);
    
    return (
      <Modal
        visible={isRelationshipModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsRelationshipModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsRelationshipModalVisible(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Relationship</Text>
            <TouchableOpacity onPress={saveRelationship}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>From: {currentNPC?.name}</Text>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>To Character *</Text>
              {availableNPCs.map((npc) => (
                <TouchableOpacity
                  key={npc.id}
                  style={[
                    styles.npcOption,
                    relationshipForm.targetNpcId === npc.id && styles.npcOptionSelected
                  ]}
                  onPress={() => setRelationshipForm({...relationshipForm, targetNpcId: npc.id})}
                >
                  <Text style={styles.npcOptionText}>{npc.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Relationship Type *</Text>
              <View style={styles.relationshipTypes}>
                {['ally', 'enemy', 'neutral', 'family', 'romantic', 'rival'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.relationshipTypeButton,
                      relationshipForm.type === type && styles.relationshipTypeButtonActive
                    ]}
                    onPress={() => setRelationshipForm({...relationshipForm, type: type as any})}
                  >
                    <Text style={[
                      styles.relationshipTypeText,
                      relationshipForm.type === type && styles.relationshipTypeTextActive
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Description *</Text>
              <TextInput
                style={styles.modalTextArea}
                value={relationshipForm.description}
                onChangeText={(text) => setRelationshipForm({...relationshipForm, description: text})}
                placeholder="Describe the relationship between these characters..."
                placeholderTextColor="#6b7280"
                multiline
                numberOfLines={3}
                maxLength={200}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Strength (1-10): {relationshipForm.strength}</Text>
              <View style={styles.strengthSlider}>
                {[1,2,3,4,5,6,7,8,9,10].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.strengthButton,
                      relationshipForm.strength === value && styles.strengthButtonActive
                    ]}
                    onPress={() => setRelationshipForm({...relationshipForm, strength: value})}
                  >
                    <Text style={[
                      styles.strengthButtonText,
                      relationshipForm.strength === value && styles.strengthButtonTextActive
                    ]}>
                      {value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
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

        {/* Template Quick Action */}
        <View style={styles.templateQuickActions}>
          <TouchableOpacity style={styles.templateButton} onPress={openTemplateModal}>
            <Ionicons name="library" size={16} color="#6b46c1" />
            <Text style={styles.templateButtonText}>Use Template</Text>
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
            <Text style={styles.modalLabel}>Importance</Text>
            <View style={styles.importanceButtons}>
              {(['major', 'minor', 'background'] as const).map((importance) => (
                <TouchableOpacity
                  key={importance}
                  style={[
                    styles.importanceButton,
                    npcForm.importance === importance && styles.importanceButtonActive
                  ]}
                  onPress={() => setNPCForm({...npcForm, importance})}
                >
                  <Text style={[
                    styles.importanceButtonText,
                    npcForm.importance === importance && styles.importanceButtonTextActive
                  ]}>
                    {importance.charAt(0).toUpperCase() + importance.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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

          {/* Enhanced Traits Section */}
          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Character Traits</Text>
            <View style={styles.traitsContainer}>
              {npcForm.traits.map((trait, index) => (
                <View key={index} style={styles.traitTag}>
                  <Text style={styles.traitText}>{trait}</Text>
                  <TouchableOpacity onPress={() => removeTrait(index)}>
                    <Ionicons name="close" size={14} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={styles.traitInput}>
              <TextInput
                style={styles.traitTextInput}
                placeholder="Add a trait..."
                placeholderTextColor="#6b7280"
                onSubmitEditing={(event) => {
                  addTrait(event.nativeEvent.text);
                  event.target.clear();
                }}
              />
            </View>
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Backstory (Optional)</Text>
            <TextInput
              style={styles.modalTextArea}
              value={npcForm.backstory}
              onChangeText={(text) => setNPCForm({ ...npcForm, backstory: text })}
              placeholder="Character's history and background..."
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  // Add the main return component modals
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
                      style={styles.relationshipButton}
                      onPress={() => openRelationshipModal(npc.id)}
                    >
                      <Ionicons name="people" size={16} color="#10b981" />
                    </TouchableOpacity>
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
                  <View style={styles.npcMetaItem}>
                    <Text style={styles.npcMetaLabel}>Importance:</Text>
                    <Text style={[styles.npcMetaValue, styles[`importance_${npc.importance || 'minor'}`]}>
                      {(npc.importance || 'minor').charAt(0).toUpperCase() + (npc.importance || 'minor').slice(1)}
                    </Text>
                  </View>
                  {npc.traits && npc.traits.length > 0 && (
                    <View style={styles.npcTraits}>
                      {npc.traits.slice(0, 3).map((trait, traitIndex) => (
                        <View key={traitIndex} style={styles.npcTraitTag}>
                          <Text style={styles.npcTraitText}>{trait}</Text>
                        </View>
                      ))}
                      {npc.traits.length > 3 && (
                        <Text style={styles.npcTraitMore}>+{npc.traits.length - 3}</Text>
                      )}
                    </View>
                  )}
                  {npc.relationships && npc.relationships.length > 0 && (
                    <View style={styles.npcRelationships}>
                      <Text style={styles.relationshipsTitle}>Relationships:</Text>
                      {npc.relationships.map((rel, relIndex) => {
                        const targetNPC = characters.key_npcs.find(n => n.id === rel.targetNpcId);
                        return (
                          <View key={relIndex} style={styles.relationshipItem}>
                            <Text style={styles.relationshipText}>
                              {rel.type} with {targetNPC?.name} ({rel.strength}/10)
                            </Text>
                            <TouchableOpacity onPress={() => removeRelationship(npc.id, rel.targetNpcId)}>
                              <Ionicons name="close" size={12} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        );
                      })}
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

      {/* All Modals */}
      <NPCModal />
      <NPCTemplateModal />
      <RelationshipModal />
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
  relationshipButton: {
    padding: 8,
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
  npcTraits: {
    flexDirection: 'row',
    gap: 4,
  },
  npcTraitTag: {
    backgroundColor: '#374151',
    padding: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  npcTraitText: {
    fontSize: 12,
    color: '#f3f4f6',
  },
  npcTraitMore: {
    fontSize: 12,
    color: '#6b7280',
  },
  npcRelationships: {
    gap: 4,
  },
  relationshipsTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
  },
  relationshipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  relationshipText: {
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
  // Template Modal Styles
  templateQuickActions: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e1b4b',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  templateButtonText: {
    color: '#6b46c1',
    fontSize: 14,
    fontWeight: '600',
  },
  templateCategories: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
  },
  categoryButtonActive: {
    backgroundColor: '#6b46c1',
  },
  categoryButtonText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  templateList: {
    padding: 20,
  },
  templateCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#404040',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f3f4f6',
  },
  templateArchetype: {
    fontSize: 12,
    color: '#6b46c1',
    backgroundColor: '#1e1b4b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 8,
    lineHeight: 20,
  },
  templatePersonality: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  templateTraits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  traitTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  traitText: {
    fontSize: 12,
    color: '#d1d5db',
  },
  traitMore: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  // NPC Enhanced Styles
  relationshipButton: {
    padding: 8,
  },
  importance_major: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  importance_minor: {
    color: '#10b981',
  },
  importance_background: {
    color: '#6b7280',
  },
  importanceButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  importanceButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 6,
    alignItems: 'center',
  },
  importanceButtonActive: {
    backgroundColor: '#6b46c1',
    borderColor: '#6b46c1',
  },
  importanceButtonText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  importanceButtonTextActive: {
    color: '#ffffff',
  },
  traitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  traitInput: {
    flexDirection: 'row',
  },
  traitTextInput: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: '#f3f4f6',
  },
  npcTraits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  npcTraitTag: {
    backgroundColor: '#374151',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  npcTraitText: {
    fontSize: 10,
    color: '#d1d5db',
  },
  npcTraitMore: {
    fontSize: 10,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  // Relationship Styles
  modalSubtitle: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  npcOption: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#404040',
  },
  npcOptionSelected: {
    backgroundColor: '#1e1b4b',
    borderColor: '#6b46c1',
  },
  npcOptionText: {
    color: '#f3f4f6',
    fontSize: 14,
  },
  relationshipTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationshipTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 16,
  },
  relationshipTypeButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  relationshipTypeText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  relationshipTypeTextActive: {
    color: '#ffffff',
  },
  strengthSlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  strengthButton: {
    width: 32,
    height: 32,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strengthButtonActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  strengthButtonText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  strengthButtonTextActive: {
    color: '#ffffff',
  },
  npcRelationships: {
    marginTop: 8,
  },
  relationshipsTitle: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
    marginBottom: 4,
  },
  relationshipItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 2,
  },
  relationshipText: {
    fontSize: 11,
    color: '#d1d5db',
  },
  templateQuickActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
  },
  templateButton: {
    backgroundColor: '#374151',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  templateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f3f4f6',
  },
  traitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  traitTag: {
    backgroundColor: '#404040',
    padding: 6,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  traitText: {
    fontSize: 14,
    color: '#f3f4f6',
  },
  traitInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  traitTextInput: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#f3f4f6',
    flex: 1,
    height: 44,
  },
  importanceButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  importanceButton: {
    backgroundColor: '#374151',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 1,
  },
  importanceButtonActive: {
    backgroundColor: '#6b46c1',
  },
  importanceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f3f4f6',
  },
  importanceButtonTextActive: {
    color: '#ffffff',
  },
  importance_major: {
    color: '#10b981',
  },
  importance_minor: {
    color: '#eab308',
  },
  importance_background: {
    color: '#9ca3af',
  },
});

export default CharacterStep;