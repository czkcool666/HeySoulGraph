import React, { useState } from 'react';
import { Text, View, Button, TextInput } from 'react-native';
import database from '@react-native-firebase/database';

const App: React.FC = () => {
  const [userInput, setUserInput] = useState<string>('');
  const [shortTermMemory, setShortTermMemory] = useState<string | null>(null);
  const [longTermMemory, setLongTermMemory] = useState<string | null>(null);
  const [secondLongTermMemory, setSecondLongTermMemory] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [inputCount, setInputCount] = useState<number>(0); // Track how many inputs have been processed

  // Function to fetch AI response for user input (short-term memory)
  const fetchAIResponseForInput = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: `what can we learn from "${userInput}", within 50 words and using first person perspective (you would be the person the text describes)` }),
      });

      const data = await response.json();
      setShortTermMemory(data.answer);
      setLongTermMemory(data.answer); // Store the first response as both short-term and long-term memory

      // Store in Firebase
      await database().ref('/memories').push({
        userInput,
        shortTermMemory: data.answer,
        longTermMemory: data.answer,
      });

      console.log('First short-term and long-term memory stored:', data.answer);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to reflect on short-term memory and store as second long-term memory
  const reflectOnShortTermMemory = async () => {
    if (!shortTermMemory) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: `what can we learn from "${shortTermMemory}"， within 70 words and using first person perspective (you would be the person the text describes)` }),
      });

      const data = await response.json();
      setSecondLongTermMemory(data.answer); // Store as second long-term memory

      // Store in Firebase
      await database().ref('/memories').push({
        secondLongTermMemory: data.answer,
      });

      console.log('Second long-term memory stored:', data.answer);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to compare long-term memories
  const compareLongTermMemory = async () => {
    if (!longTermMemory || !secondLongTermMemory) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: `Is the answer "${secondLongTermMemory}".` }),
      });

      const data = await response.json();
      console.log('Comparison result:', data.answer);

      if (data.answer.toLowerCase() === 'yes') {
        // If the second long-term memory is better, stop the loop and clear short-term memory
        await database().ref('/short-term-memory').remove();
        console.log('Done learning. Short-term memory cleared.');
      } else {
        setLongTermMemory(secondLongTermMemory); // Replace the first long-term memory with the second
        console.log('The second long-term memory replaced the first.');
        setInputCount(inputCount + 1); // Increment the input count

        if (inputCount >= 2) {
          // If input happens more than 2 times, store long-term memory and clear short-term memory
          await database().ref('/short-term-memory').remove();
          console.log('Done learning after 2 inputs. Short-term memory cleared.');
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Provide Input:</Text>
      <TextInput
        style={{ borderColor: 'gray', borderWidth: 1, marginBottom: 10, padding: 5 }}
        placeholder="Type your input here"
        value={userInput}
        onChangeText={setUserInput}
      />
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <View>
          <Text>Short-term Memory: {shortTermMemory || 'None yet.'}</Text>
          <Text>Long-term Memory: {longTermMemory || 'None yet.'}</Text>
          <Text>Second Long-term Memory: {secondLongTermMemory || 'None yet.'}</Text>
        </View>
      )}

      <Button title="Submit Input" onPress={fetchAIResponseForInput} />
      <Button title="Reflect on Short-term Memory" onPress={reflectOnShortTermMemory} disabled={!shortTermMemory} />
      <Button title="Compare Long-term Memories" onPress={compareLongTermMemory} disabled={!secondLongTermMemory} />
    </View>
  );
};

export default App;
