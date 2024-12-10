document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('search-button');
    const cityInput = document.getElementById('city-input'); // Kullanıcıdan şehir adı alır

    // Varsayılan olarak İstanbul verisini yükle
    fetchWeatherData('İstanbul');

    // Şehir arama butonuna tıklanınca veri güncelle
    searchButton.addEventListener('click', () => {
        const cityName = cityInput.value.trim();
        if (cityName) {
            fetchWeatherData(cityName);
        }
    });
   // Kullanıcı Enter tuşuna bastığında da arama yapılacak
   cityInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Formun submit olmasını engelle
        searchButton.click(); // Butona tıklanmış gibi işlem yap
    }
});
    function fetchWeatherData(city) {
        fetch(`/update-weather?city=${city}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert('Veri alınamadı: ' + data.error);
                    return;
                }
                // HTML öğelerini güncelle
                document.getElementById('city-name').textContent = data.city_name;
                document.getElementById('date-time').textContent = new Date().toLocaleString('tr-TR');
                document.getElementById('weather-icon').src = data.current_weather.hava_durumu_ikonu;
                document.getElementById('temperature').textContent = `${data.current_weather.sıcaklık}°C`;
                document.getElementById('description').textContent = data.current_weather.hava_durumu_bilgisi;
                document.getElementById('humidity').textContent = `Nem: ${data.current_weather.nem}%`;
                document.getElementById('wind-speed').textContent = `Rüzgar: ${data.current_weather.rüzgar} m/s`;
                document.getElementById('pressure').textContent = `Basınç: ${data.current_weather.basınç} hPa`;
                document.getElementById('last-update').textContent = `Son Güncelleme: ${new Date(data.current_weather.güncelleme_zamanı).toLocaleString('tr-TR')}`;

                // Sabah, öğle, akşam ve gece tahminlerini güncelle
                document.getElementById('forecast-morning').innerHTML = `
                    <img src="${data.hourly_weather[6].hava_durumu_ikonu}" alt="Sabah İkonu">
                    <p>${data.hourly_weather[6].sıcaklık}°C</p>`;
                document.getElementById('forecast-noon').innerHTML = `
                    <img src="${data.hourly_weather[12].hava_durumu_ikonu}" alt="Öğle İkonu">
                    <p>${data.hourly_weather[12].sıcaklık}°C</p>`;
                document.getElementById('forecast-evening').innerHTML = `
                    <img src="${data.hourly_weather[18].hava_durumu_ikonu}" alt="Akşam İkonu">
                    <p>${data.hourly_weather[18].sıcaklık}°C</p>`;
                document.getElementById('forecast-night').innerHTML = `
                    <img src="${data.hourly_weather[0].hava_durumu_ikonu}" alt="Gece İkonu">
                    <p>${data.hourly_weather[0].sıcaklık}°C</p>`;
            })
            .catch(error => console.error('Veri çekme hatası:', error));
    }
});
