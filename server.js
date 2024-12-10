require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
app.use('/icons', express.static(path.join(__dirname, 'icons')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// HTML klasörünü statik olarak sunuyoruz
app.use(express.static(path.join(__dirname, 'html')));

const mongoUri = process.env.MONGO_URI;
const weatherApiKey = process.env.WEATHERAPI_API_KEY;
const openWeatherApiKey = process.env.OPENWEATHER_API_KEY;

app.get('/', (req, res) => {
    res.redirect('/update-weather?city=İstanbul');
});

app.get('/update-weather', async (req, res) => {
    const city = req.query.city || 'İstanbul'; // Varsayılan şehir
    try {console.log("Fetching data for:", city);
        const collection = await connectMongo();
        let weatherData = await collection.findOne({ city_name: { $regex: `^${city}$`, $options: 'i' } });

        if (!weatherData || !(await isWeatherDataUpToDate(city))) {
            weatherData = await fetchAndSaveWeatherData(city); // Güncel değilse yenile
        }

        res.json(weatherData); // JSON formatında döndür
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Veri alınırken bir hata oluştu.' });
    }
});


app.get('/currently', async (req, res) => {
    const city = req.query.city; // Get the city name from the query parameter

    if (!city) {
        return res.status(400).send('City parameter is required.');
    }

    try {
        const collection = await connectMongo(); // Connect to the MongoDB collection
        const weatherData = await collection.findOne({ city_name: { $regex: `^${city}$`, $options: 'i' } });

        if (!weatherData) {
            return res.status(404).send('City data not found.');
        }

        res.render('currently', { weatherData });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while fetching data.');
    }
});

app.get('/hourly', async (req, res) => {
    const city = req.query.city; // Get the city name from the query parameter

    if (!city) {
        return res.status(400).send('City parameter is required.');
    }

    try {
        const collection = await connectMongo(); // Connect to the MongoDB collection
        const weatherData = await collection.findOne({ city_name: { $regex: `^${city}$`, $options: 'i' } });

        if (!weatherData) {
            return res.status(404).send('City data not found.');
        }

        res.render('hourly', { weatherData });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while fetching data.');
    }
});


app.get('/weekly', async (req, res) => {
    const city = req.query.city; // Get the city name from the query parameter

    if (!city) {
        return res.status(400).send('City parameter is required.');
    }

    try {
        const collection = await connectMongo(); // Connect to the MongoDB collection
        const weatherData = await collection.findOne({ city_name: { $regex: `^${city}$`, $options: 'i' } });

        if (!weatherData) {
            return res.status(404).send('City data not found.');
        }

        res.render('weekly', { weatherData });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while fetching data.');
    }
});

async function connectMongo() {
    const client = new MongoClient(mongoUri);
    await client.connect();
    return client.db('weatherDB').collection('weatherData');
}

// Veri güncelliğini kontrol etme
async function isWeatherDataUpToDate(city) {
    const collection = await connectMongo();
    const cityData = await collection.findOne({ city_name: { $regex: `^${city}$`, $options: 'i' } });
    
    if (cityData && cityData.current_weather && cityData.current_weather.güncelleme_zamanı) {
        const lastUpdateTime = new Date(cityData.current_weather.güncelleme_zamanı);
        const currentTime = new Date();
        const timeDifference = (currentTime - lastUpdateTime) / (1000 * 60);

        if (timeDifference < 15) {
            return cityData;
        }
    }
    return null;
}

// WeatherAPI'den anlık ve saatlik veri, OpenWeatherMap'ten haftalık veri çekme ve kaydetme
async function fetchAndSaveWeatherData(city) {
    const weatherApiUrl = `http://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${city}&days=1&aqi=no&alerts=no`;
    const openWeatherUrl = `http://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${openWeatherApiKey}&units=metric`;
    const collection = await connectMongo();

    try {
        const weatherApiResponse = await axios.get(weatherApiUrl);
        const openWeatherResponse = await axios.get(openWeatherUrl);
        const data = weatherApiResponse.data;
        const weeklyData = openWeatherResponse.data;

        let apiCityName = data.location.name.trim();

        const currentWeather = {
            sıcaklık: data.current.temp_c,
            hissedilen_sıcaklık: data.current.feelslike_c,
            hava_durumu_bilgisi: data.current.condition.text,
            hava_durumu_ikonu: data.current.condition.icon,
            nem: data.current.humidity,
            basınç: data.current.pressure_mb,
            rüzgar: data.current.wind_kph,
            güncelleme_zamanı: new Date(data.current.last_updated_epoch * 1000)
        };

        const hourlyWeather = data.forecast.forecastday[0].hour.map(hour => ({
            saat: hour.time.split(' ')[1],
            sıcaklık: hour.temp_c,
            nem: hour.humidity,
            basınç: hour.pressure_mb,
            rüzgar: hour.wind_kph,
            yağış: hour.precip_mm,
            yağış_ihtimali: hour.chance_of_rain,
            hava_durumu_ikonu: hour.condition.icon
        }));

        
        
        const weeklyWeather = weeklyData.list
        .filter((item, index) => index % 8 === 0) 
        .slice(0, 5) // İlk 5 günü al
        .map(day => ({
            sabah_sıcaklık: day.main.temp_max,
            gece_sıcaklık: day.main.temp_min,
            hava_durumu_ikonu: day.weather[0].icon
        }));

        const weatherDocument = {
            city_name: apiCityName,
            current_weather: currentWeather,
            hourly_weather: hourlyWeather,
            weekly_weather: weeklyWeather
        };

        await collection.updateOne(
            { city_name: { $regex: `^${apiCityName}$`, $options: 'i' } },
            { $set: weatherDocument },
            { upsert: true }
        );

        return weatherDocument;
    } catch (error) {
        console.error(`API hatası: ${error}`);
        return null;
    }
}

// Ana sayfa (metin kutusu ve buton görüntülenir)
app.get('/', (req, res) => {
    res.render('index', { weatherData: null, error: null });
});

// Butona basıldığında şehre göre veri güncelle
app.post('/update-weather', async (req, res) => {
    const city = req.body.city_name;

    if (!city) {
        return res.render('index', { weatherData: null, error: 'Şehir adı giriniz.' });
    }

    let weatherData = await isWeatherDataUpToDate(city);

    if (!weatherData) {
        weatherData = await fetchAndSaveWeatherData(city);
    }

    if (weatherData) {
        res.render('index', { weatherData: weatherData, error: null });
    } else {
        res.render('index', { weatherData: null, error: 'Veri alınamadı veya güncellenemedi.' });
    }
});

app.listen(3000, () => {
    console.log('Sunucu localhost:3000 üzerinde çalışıyor.');
});
