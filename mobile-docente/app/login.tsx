import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../lib/auth-context';
import { theme } from '../lib/theme';

/**
 * Login — mesmo layout do app do aluno (mobile/app/login.tsx), só troca o
 * subtítulo pra "Portal do Professor". `useAuth().login()` já rejeita
 * contas sem professorId vinculado (ver lib/auth-context.tsx).
 */
export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar() {
    if (!email.trim() || !senha) {
      setErro('Informe e-mail e senha.');
      return;
    }
    setErro(null);
    setEnviando(true);
    const resultado = await login(email.trim(), senha);
    setEnviando(false);
    if (!resultado.ok) {
      setErro(resultado.error);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Image
          source={require('../assets/logo-colorida.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.subtitulo}>Portal do Professor</Text>

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor={theme.cinza400}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor={theme.cinza400}
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
          onSubmitEditing={entrar}
        />

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <TouchableOpacity style={styles.botao} onPress={entrar} disabled={enviando}>
          {enviando ? (
            <ActivityIndicator color={theme.branco} />
          ) : (
            <Text style={styles.botaoTexto}>Entrar</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.corPrimaria,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.branco,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  logo: { width: 220, height: 72, marginBottom: 12 },
  subtitulo: { fontSize: 14, color: theme.cinza500, marginBottom: 20 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: theme.cinza200,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
    color: theme.cinza900,
  },
  erro: { color: theme.erro, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  botao: {
    width: '100%',
    backgroundColor: theme.corPrimaria,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  botaoTexto: { color: theme.branco, fontSize: 15, fontWeight: '600' },
});
