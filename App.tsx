import React, { useState } from 'react';
import { Text, View, Button, TextInput, ScrollView } from 'react-native';
import database from '@react-native-firebase/database';

const App: React.FC = () => {
  const [userInput, setUserInput] = useState<string>('');
  const [shortTermMemory, setShortTermMemory] = useState<string | null>(null);
  const [firstLongTermMemory, setFirstLongTermMemory] = useState<string | null>(null);
  const [secondLongTermMemory, setSecondLongTermMemory] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [inputCount, setInputCount] = useState<number>(0); // Track how many inputs have been processed
  const [learningStatus, setLearningStatus] = useState<string>('........Please provide me more.......'); // Default message
  const [memoryKey, setMemoryKey] = useState<string | null>(null);

  // Step control for button unlocking/locking
  const [step, setStep] = useState<'submit' | 'reflect' | 'compare'>('submit');

  const fetchAIResponseForInput = async () => {
    setLoading(true);
    setLearningStatus('Please provide me more'); // Reset learning status when new input is provided
    try {
      const response = await fetch('http://localhost:3000/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `what can we learn from "${userInput}", expand it within 50 words`
        }),
      });

      const data = await response.json();
      setShortTermMemory(data.answer);
      setFirstLongTermMemory(data.answer); // Store the first response as both short-term and first long-term memory

      // Store in Firebase and get the unique key (memory entry ID)
      const memoryRef = await database().ref('/memories').push({
        userInput,
        shortTermMemory: data.answer,
        firstLongTermMemory: data.answer,
      });

      setMemoryKey(memoryRef.key); // Save the key for later updates

      console.log('First short-term and long-term memory stored:', data.answer);

      // Move to next step: Unlock 'Reflect on Short-term Memory' button
      setStep('reflect');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const reflectOnShortTermMemory = async () => {
    if (!shortTermMemory || !memoryKey) return; // Ensure we have both shortTermMemory and the memoryKey

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `what can we learn from "${shortTermMemory}"，expand it within 50 words`
        }),
      });

      const data = await response.json();
      setSecondLongTermMemory(data.answer); // Store as second long-term memory

      // Update the existing Firebase entry with secondLongTermMemory using the saved key
      await database().ref(`/memories/${memoryKey}`).update({
        secondLongTermMemory: data.answer,
      });

      console.log('Second long-term memory stored:', data.answer);

      // Move to next step: Unlock 'Compare Long-term Memories' button
      setStep('compare');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const compareLongTermMemory = async () => {
    if (!firstLongTermMemory || !secondLongTermMemory) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Is the answer "${secondLongTermMemory}" better than the ${firstLongTermMemory}, JUST ONLY ANSWER YES OR NO!!!`
        }),
      });

      const data = await response.json();
      console.log('Comparison result:', data.answer);

      if (data.answer.toLowerCase() === 'yes') {
        console.log('Done learning. Short-term memory cleared.');
        setLearningStatus('I\'ve fully understood now'); // Set message for successful learning
      } else {
        setFirstLongTermMemory(secondLongTermMemory); // Replace the first long-term memory with the second
        setInputCount(inputCount + 1); // Increment the input count

        if (inputCount >= 2) {
          console.log('Done learning after 2 inputs. Short-term memory cleared.');
          setLearningStatus('I\'ve fully understood now'); // Set message for successful learning
        } else {
          setLearningStatus('Please provide me more'); // Set message for needing more input
        }
      }

      // Move to next step: Reset to unlock 'Submit Input' button
      setStep('submit');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Provide Input:</Text>
      <TextInput
        style={{ borderColor: 'gray', borderWidth: 1, marginBottom: 10, padding: 5 }}
        placeholder="Type your input here"
        value={userInput}
        onChangeText={setUserInput}
      />

      {/* Text for memories remains constant */}
      <View>
        <Text>Short-term Memory: {shortTermMemory || 'None yet.'}</Text>
        <Text style={{ marginTop: 10 }}>First Long-term Memory: {firstLongTermMemory || 'None yet.'}</Text>
        <Text style={{ marginTop: 10 }}>Second Long-term Memory: {secondLongTermMemory || 'None yet.'}</Text>
      </View>

      {/* Display learning status */}
      <Text style={{ marginTop: 20, fontWeight: 'bold', fontSize: 16 }}>{learningStatus}</Text>

      {/* Buttons are controlled by the step state */}
      <Button title="Submit Input" onPress={fetchAIResponseForInput} disabled={step !== 'submit'} />
      <Button title="Reflect on Short-term Memory" onPress={reflectOnShortTermMemory} disabled={step !== 'reflect'} />
      <Button title="Compare Long-term Memories" onPress={compareLongTermMemory} disabled={step !== 'compare'} />
    </ScrollView>
  );
};

export default App;
