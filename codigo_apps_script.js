function doPost(e) {
  try {
    // Acessa a aba ativa da planilha onde o script está vinculado
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Pega o conteúdo da requisição POST feita pelo chatbot
    var body = e.postData.contents;
    var data = JSON.parse(body);
    
    // Organiza os dados recebidos na ordem desejada:
    var rowData = [
      new Date(),                     // Data e Hora do preenchimento
      data.nome || "",                // Nome completo
      data.nome_cracha || "",         // Nome para crachá
      data.email || "",               // E-mail
      data.telefone || "",            // Telefone
      data.genero || "",              // Gênero
      data.nascimento || "",          // Data de Nascimento
      data.escolaridade || "",        // Escolaridade
      data.formacao || "",            // Formação ou estudo
      data.momento_profissional || "",// Momento profissional
      data.cargo_empresa || "",       // Cargo e empresa
      data.renda || "",               // Renda mensal atual
      data.tempo_setor || "",         // Tempo no setor ambiental
      data.restricao_alimentar || "", // Restrição alimentar
      data.termo_aceite || ""         // Termo de aceite
    ];
    
    // Adiciona uma nova linha com os dados
    sheet.appendRow(rowData);
    
    // Retorna sucesso para o navegador (mesmo que com no-cors ele não consiga ler)
    return ContentService.createTextOutput(JSON.stringify({ "status": "success" }))
                         .setMimeType(ContentService.MimeType.JSON);
                         
  } catch (error) {
    // Retorna o erro, caso aconteça algum problema
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.message }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}
