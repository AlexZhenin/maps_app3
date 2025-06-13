import { DatabaseProvider } from '@/contexts/DatabaseContext';
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
  <DatabaseProvider>
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Карта '}} />
      <Stack.Screen name="marker/[id]" options={{ title: 'Информация о маркере' }}/>
      <Stack.Screen name="location-test" options={{ title: 'Тест GPS' }}/>
    </Stack>
  </DatabaseProvider>
  );
}
