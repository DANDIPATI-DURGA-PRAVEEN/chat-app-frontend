import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Heading,
  useToast,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:1337';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Login URL:', `${API_URL}/api/auth/local`);
      console.log('Login data:', { identifier: email, password });
      
      const response = await axios.post(`${API_URL}/api/auth/local`, {
        identifier: email,
        password,
      });

      console.log('Login successful:', response.data);

      if (!response.data.jwt || !response.data.user) {
        throw new Error('Invalid response from server');
      }
      
      localStorage.setItem('token', response.data.jwt);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/chat');
    } catch (error) {
      console.error('Login failed:', error.response?.data || error);
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Login failed',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg">
      <form onSubmit={handleSubmit}>
        <Stack spacing={4}>
          <Heading size="lg" textAlign="center">Login</Heading>
          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>
          <Button type="submit" colorScheme="blue" width="full">
            Login
          </Button>
          <Button 
            variant="link" 
            colorScheme="blue" 
            onClick={() => navigate('/register')}
          >
            Don't have an account? Register
          </Button>
        </Stack>
      </form>
    </Box>
  );
}

export default Login; 