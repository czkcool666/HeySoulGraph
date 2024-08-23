import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import database from '@react-native-firebase/database';

const App: React.FC = () => {
  const [data, setData] = useState<string | null>(null);

  useEffect(() => {
    // Write some data to the database
    database()
      .ref('/test')
      .set({
        testKey: 'Firebase is working!',
      })
      .then(() => console.log('Data written to Realtime Database.'))
      .catch((error) => console.log('Failed to write data:', error));

    // Read the data from the database
    const dataRef = database().ref('/test');
    dataRef.once('value')
      .then(snapshot => {
        const fetchedData = snapshot.val();
        console.log('Data from Realtime Database:', fetchedData);
        setData(fetchedData.testKey); // Set the data to the state
      })
      .catch((error) => {
        console.log('Failed to read data:', error);
      });
  }, []);

  return (
    <View>
      <Text>Firebase Realtime Database Check</Text>
      {data ? (
        <Text>Data from Database: {data}</Text>
      ) : (
        <Text>Loading data...</Text>
      )}
    </View>
  );
};

export default App;
