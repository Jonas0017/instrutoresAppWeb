# 🧪 Guia de Testes - QR Code de Presença

## 1️⃣ Gerar URLs de Teste

### Método 1: Usar o Console do Navegador

1. Abra a página: `http://localhost:3000/marcar-presenca`
2. Abra o Console (F12)
3. Cole e execute este código:

```javascript
// Função para gerar URL de teste
function gerarURLTeste(dados) {
  const dadosJSON = JSON.stringify(dados);
  const dadosBase64 = btoa(dadosJSON);
  const dadosCodificados = encodeURIComponent(dadosBase64);
  return `http://localhost:3000/marcar-presenca?data=${dadosCodificados}`;
}

// TESTE 1: Dados válidos (use dados reais do seu Firebase)
const dadosValidos = {
  pais: "Brasil",
  estado: "SP",
  lumisial: "São Paulo",
  turmaId: "T001",
  palestraId: "P001",
  fragmentoNumero: 1,
  nomePalestra: "Introdução ao Curso",
  nomeInstrutor: "João Silva"
};

console.log("URL VÁLIDA:");
console.log(gerarURLTeste(dadosValidos));

// TESTE 2: Dados incompletos (deve dar erro)
const dadosIncompletos = {
  pais: "Brasil",
  estado: "SP",
  // Faltando campos obrigatórios
};

console.log("\nURL COM DADOS INCOMPLETOS (deve dar erro):");
console.log(gerarURLTeste(dadosIncompletos));

// TESTE 3: Turma inexistente (deve dar erro ao validar aluno)
const dadosTurmaInexistente = {
  pais: "Brasil",
  estado: "SP",
  lumisial: "São Paulo",
  turmaId: "T999",
  palestraId: "P999",
  fragmentoNumero: 1,
  nomePalestra: "Palestra Teste",
  nomeInstrutor: "Instrutor Teste"
};

console.log("\nURL COM TURMA INEXISTENTE (deve dar erro ao marcar):");
console.log(gerarURLTeste(dadosTurmaInexistente));
```

4. Copie as URLs geradas e teste no navegador

---

## 2️⃣ Teste com Dados Reais do Firebase

### Passo 1: Pegue dados reais do seu Firebase

1. Acesse o Firebase Console
2. Navegue até: `paises/{pais}/estados/{estado}/lumisial/{lumisial}/turmas/{turmaId}`
3. Anote:
   - País (ex: "Brasil")
   - Estado (ex: "SP")
   - Lumisial (ex: "São Paulo")
   - turmaId (ex: "T001")
   - palestraId (ex: "P001")

### Passo 2: Gere URL com dados reais

```javascript
// Cole no console do navegador
const dadosReais = {
  pais: "Brasil",              // ← ALTERE AQUI
  estado: "SP",                 // ← ALTERE AQUI
  lumisial: "São Paulo",        // ← ALTERE AQUI
  turmaId: "T001",              // ← ALTERE AQUI
  palestraId: "P001",           // ← ALTERE AQUI
  fragmentoNumero: 1,
  nomePalestra: "Introdução ao Curso",
  nomeInstrutor: "João Silva"
};

const dadosJSON = JSON.stringify(dadosReais);
const dadosBase64 = btoa(dadosJSON);
const url = `http://localhost:3000/marcar-presenca?data=${encodeURIComponent(dadosBase64)}`;
console.log(url);
```

### Passo 3: Pegue o código de um aluno real

1. No Firebase, vá até: `paises/.../turmas/{turmaId}/alunos`
2. Copie o ID de um aluno (o documento ID)
3. Use esse código para testar a marcação

---

## 3️⃣ Cenários de Teste de Segurança

### ✅ Teste 1: QR Code Válido
- **URL:** Gerada com dados reais
- **Código Aluno:** ID real do Firebase
- **Resultado Esperado:** ✅ Presença marcada com sucesso

### ❌ Teste 2: Código de Aluno Inválido
- **URL:** Gerada com dados reais
- **Código Aluno:** "ALUNO_FALSO_123"
- **Resultado Esperado:** ❌ "Código de aluno não encontrado nesta turma"

### ❌ Teste 3: Aluno de Outra Turma
- **URL:** Turma T001
- **Código Aluno:** Aluno da turma T002
- **Resultado Esperado:** ❌ "Código de aluno não encontrado nesta turma"

### ❌ Teste 4: Aluno Desativado
- **URL:** Gerada com dados reais
- **Código Aluno:** ID de aluno com `status: "desativado"` no Firebase
- **Resultado Esperado:** ❌ "Aluno desativado. Entre em contato com o instrutor."

### ❌ Teste 5: Presença Duplicada
- **URL:** Gerada com dados reais
- **Código Aluno:** ID de aluno que já marcou presença
- **Resultado Esperado:** ❌ "Presença já registrada para esta lição"

### ❌ Teste 6: Dados Corrompidos
- **URL:** `http://localhost:3000/marcar-presenca?data=DADOS_INVALIDOS`
- **Resultado Esperado:** ❌ "QR Code inválido - dados não encontrados"

### ❌ Teste 7: Base64 Corrompido
```javascript
// Cole no console
const dadosInvalidos = btoa("{ dados json invalidos }");
const url = `http://localhost:3000/marcar-presenca?data=${encodeURIComponent(dadosInvalidos)}`;
console.log(url);
```
- **Resultado Esperado:** ❌ "QR Code inválido ou corrompido"

---

## 4️⃣ Teste Completo do Fluxo

### No App Mobile:

1. Entre no Controle de Presença
2. Clique no botão flutuante roxo (QR Code)
3. Clique em "Compartilhar"
4. Copie o link gerado
5. Abra o link no navegador

### No Navegador Web:

1. Digite um código de aluno válido
2. Clique em "Marcar Presença"
3. Verifique se aparece "Presença Confirmada!"

### Validação no Firebase:

1. Vá até Firebase Console
2. Navegue: `paises/.../turmas/{turmaId}/palestras/{palestraId}/presenca/{alunoId}`
3. Verifique:
   - `status: "presente"`
   - `data: "2025-11-04"` (data atual)
   - `instrutor: "Nome do Instrutor"`
   - `marcadoViaQR: true`

---

## 5️⃣ URLs de Exemplo Prontas

### Exemplo 1: Dados Completos
```
http://localhost:3000/marcar-presenca?data=eyJwYWlzIjoiQnJhc2lsIiwiZXN0YWRvIjoiU1AiLCJsdW1pc2lhbCI6IlPDo28gUGF1bG8iLCJ0dXJtYUlkIjoiVDAwMSIsInBhbGVzdHJhSWQiOiJQMDAxIiwiZnJhZ21lbnRvTnVtZXJvIjoxLCJub21lUGFsZXN0cmEiOiJJbnRyb2R1w6fDo28gYW8gQ3Vyc28iLCJub21lSW5zdHJ1dG9yIjoiSm/Do28gU2lsdmEifQ%3D%3D
```

### Exemplo 2: Dados Incompletos (deve dar erro)
```
http://localhost:3000/marcar-presenca?data=eyJwYWlzIjoiQnJhc2lsIn0%3D
```

### Exemplo 3: JSON Corrompido (deve dar erro)
```
http://localhost:3000/marcar-presenca?data=YWJjZGVmZ2hpamts
```

---

## 6️⃣ Checklist de Segurança ✅

- [ ] Página valida dados antes de processar
- [ ] Não aceita QR Code sem parâmetros
- [ ] Não aceita Base64 inválido
- [ ] Não aceita JSON malformado
- [ ] Valida se aluno existe no Firebase
- [ ] Valida se aluno está ativo
- [ ] Impede marcação duplicada
- [ ] Não expõe informações sensíveis
- [ ] Não permite SQL injection (usa Firestore)
- [ ] Dados ficam ocultos no QR (Base64)

---

## 7️⃣ Console de Desenvolvedor

Para ver logs durante os testes, abra o Console (F12) e observe:

- `✅ "Presença marcada com sucesso"`
- `❌ "Erro ao validar aluno"`
- `❌ "Código de aluno não encontrado"`
- `❌ "QR Code inválido"`

---

## 📝 Notas Importantes

1. **Localhost:** As URLs de teste usam `localhost:3000`, ajuste a porta se necessário
2. **Produção:** Quando subir para produção, as URLs serão geradas automaticamente com o domínio correto
3. **Firebase:** Certifique-se de ter permissões de leitura/escrita no Firestore
4. **Dados Reais:** Sempre use dados reais do Firebase para testes válidos

---

## 🐛 Problemas Comuns

### Erro: "QR Code inválido"
- Verifique se o parâmetro `?data=` está presente na URL
- Verifique se o Base64 está correto

### Erro: "Código de aluno não encontrado"
- Verifique se o ID do aluno existe no Firebase
- Verifique se o aluno pertence à turma correta

### Erro: "Aluno desativado"
- Verifique o campo `status` do aluno no Firebase
- Apenas alunos com `status: "ativo"` podem marcar presença

### Erro de CORS
- Se estiver testando de outro domínio, configure CORS no Firebase
