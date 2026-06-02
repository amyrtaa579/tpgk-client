const url = 'https://api.anmicius.ru/api/v1/about';
console.log('Попытка обращения к:', url);

fetch(url)
  .then(response => {
    if (!response.ok) {
      throw new Error('HTTP ошибка! Статус: ' + response.status);
    }
    return response.json();
  })
  .then(data => {
    console.log('✅ Успех! Данные получены:');
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error('❌ Ошибка при запросе:', error.message);
  });
