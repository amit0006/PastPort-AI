import { useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import PersonaSelection from './components/PersonaSelection';
import ChatInterface from './components/ChatInterface';

export type Persona = {
  id: string;
  name: string;
  era: string;
  description: string;
  bio: string;
  image: string;
};

export type Screen = 'welcome' | 'selection' | 'chat';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  const handleGetStarted = () => {
    setCurrentScreen('selection');
  };

  const handlePersonaSelect = (persona: Persona) => {
    setSelectedPersona(persona);
    setCurrentScreen('chat');
  };

  const handleBack = () => {
    if (currentScreen === 'chat') {
      setCurrentScreen('selection');
      setSelectedPersona(null);
    } else if (currentScreen === 'selection') {
      setCurrentScreen('welcome');
    }
  };

  return (
    <div className="min-h-screen">
      {currentScreen === 'welcome' && (
        <WelcomeScreen onGetStarted={handleGetStarted} />
      )}
      {currentScreen === 'selection' && (
        <PersonaSelection onSelectPersona={handlePersonaSelect} onBack={handleBack} />
      )}
      {currentScreen === 'chat' && selectedPersona && (
        <ChatInterface persona={selectedPersona} onBack={handleBack} />
      )}
    </div>
  );
}
