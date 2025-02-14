import { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  Input,
  Button,
  Text,
  Flex,
  Avatar,
  useToast,
} from '@chakra-ui/react';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!token || !userData) {
      navigate('/login');
      return;
    }
    setUser(userData);

    // Connect to WebSocket with token
    const newSocket = io(process.env.REACT_APP_BACKEND_URL, {
      auth: { token },
      transports: ['websocket'],
      withCredentials: true
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
      toast({
        title: 'Connected',
        description: 'Welcome to the chat!',
        status: 'success',
        duration: 3000,
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to chat server',
        status: 'error',
        duration: 3000,
      });
    });

    newSocket.on('message', (message) => {
      console.log('Received message:', message);
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [navigate, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load message history
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Loading messages with token:', token);
        
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/messages?populate=sender`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log('API Response:', response.data);

        if (!response.data || !response.data.data) {
          console.error('Invalid response format:', response.data);
          throw new Error('Invalid response format');
        }

        const formattedMessages = response.data.data.map(msg => ({
          id: msg.id,
          text: msg.attributes.content,
          sender: msg.attributes.sender.data.attributes.username,
          userId: msg.attributes.sender.data.id,
          timestamp: msg.attributes.createdAt
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.error('Load messages error:', error.response || error);
        toast({
          title: 'Error',
          description: error.response?.data?.error?.message || 'Failed to load message history',
          status: 'error',
          duration: 3000,
        });
      }
    };

    if (user) {
      loadMessages();
    }
  }, [user, toast]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !socket) return;

    try {
      const newMessage = {
        text: message,
        sender: user.username,
        userId: user.id,
        timestamp: new Date().toISOString(),
      };

      console.log('Sending message:', newMessage);
      socket.emit('message', newMessage);
      setMessage('');
    } catch (error) {
      console.error('Send message error:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Box 
      maxW={{ base: "100%", md: "lg" }} 
      mx="auto" 
      mt={{ base: 2, md: 8 }} 
      p={{ base: 2, md: 4 }}
    >
      <Flex 
        direction={{ base: "column", md: "row" }}
        justifyContent="space-between" 
        alignItems="center" 
        mb={4}
      >
        <Flex alignItems="center" gap={2}>
          <Avatar size="sm" name={user?.username} />
          <Text fontSize="lg" fontWeight="bold">{user?.username}</Text>
        </Flex>
        <Button onClick={handleLogout} colorScheme="red" size="sm">
          Logout
        </Button>
      </Flex>

      <Box
        height={{ base: "70vh", md: "60vh" }}
        overflowY="auto"
        borderWidth={1}
        borderRadius="lg"
        p={{ base: 2, md: 4 }}
        mb={4}
        bg="gray.50"
      >
        <VStack spacing={4} align="stretch">
          {messages.map((msg, index) => (
            <Box
              key={index}
              bg={msg.userId === user?.id ? 'blue.100' : 'white'}
              p={3}
              borderRadius="lg"
              borderWidth={1}
              alignSelf={msg.userId === user?.id ? 'flex-end' : 'flex-start'}
              maxW="80%"
              shadow="sm"
            >
              <Text fontSize="sm" fontWeight="bold" color="gray.600">
                {msg.sender}
              </Text>
              <Text>{msg.text}</Text>
              <Text fontSize="xs" color="gray.500">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </Text>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      <form onSubmit={sendMessage}>
        <Flex 
          gap={2}
          direction={{ base: "column", sm: "row" }}
        >
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            bg="white"
            size={{ base: "sm", md: "md" }}
          />
          <Button 
            type="submit" 
            colorScheme="blue"
            width={{ base: "full", sm: "auto" }}
          >
            Send
          </Button>
        </Flex>
      </form>
    </Box>
  );
}

export default Chat; 