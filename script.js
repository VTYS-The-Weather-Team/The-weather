let islogin = "";
document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('city-input'); // Kullanıcıdan şehir adı alır
    const toggleButton = document.querySelector('.toggle-button');
    const weatherTbody = document.getElementById('weather-tbody');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const newUsernameInput = document.getElementById('newUsername');
    const newPasswordInput = document.getElementById('newPassword');
    const newEmailInput = document.getElementById('newEmail');
    const cityElements = document.querySelectorAll('.city');
    const regionInfoElement = document.getElementById('region-info');
    const languageSelector = document.querySelector('.language-selector');
    const matches = document.querySelector('.additional-settings .matches');
    const iconsBasePath = "/icons/"; // İkonların bulunduğu klasör


    const defaultCity = 'Sivas'; 
    const openCageApiKey = '68f14cb81c9d4c1aa74af624b79baade'; 
    
    fetchWeatherData(defaultCity);
    // Sayfa yüklendiğinde konumu kontrol et
    requestLocation();

    async function getUserCity(latitude, longitude) {
        try {
            const response = await fetch(
                `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${openCageApiKey}`
            );
            const data = await response.json();

            if (data.results.length > 0) {
                // Öncelikle 'state' bilgisini kontrol et
                const components = data.results[0].components;
                return (
                    components.state || // Öncelikli 'state' bilgisini al
                    components.city || // Şehir bilgisini al
                    components.town || // Kasaba bilgisini al
                    components.village || // Köy bilgisini al
                    defaultCity // Hiçbiri yoksa varsayılan şehir
                );
            }
        } catch (error) {
            console.error('Şehir bilgisi alınırken hata:', error);
        }
        return defaultCity; // Hata durumunda
    }

    function requestLocation() {
        if (!navigator.geolocation) {
            console.warn('Tarayıcı konum izni desteklemiyor.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const city = await getUserCity(latitude, longitude);
                console.log(`Bulunduğunuz şehir: ${city}`);
                fetchWeatherData(city); // Şehirle hava durumunu getir
            }
        );
    }

    

    // Giriş ekranındaki Enter tuşu davranışı
    emailInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();  // Formun submit olmasını engelle
            passwordInput.focus();   // Şifre alanına geçiş yap
        }
    });

    passwordInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();  // Formun submit olmasını engelle
            submitLogin();           // Giriş fonksiyonu çalıştır
        }
    });

    // Kayıt ekranındaki Enter tuşu davranışı
    newUsernameInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();  // Formun submit olmasını engelle
            newPasswordInput.focus(); // Şifre alanına geçiş yap
        }
    });

    newPasswordInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();  // Formun submit olmasını engelle
            newEmailInput.focus();   // E-posta alanına geçiş yap
        }
    });

    newEmailInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();  // Formun submit olmasını engelle
            submitRegistration();    // Kayıt fonksiyonu çalıştır
        }
    });



    // Kullanıcı Enter tuşuna bastığında da arama yapılacak
    cityInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Formun submit olmasını engelle
            const cityName = cityInput.value.trim(); // Arama kutusundaki değeri al
            if (cityName) {
                fetchWeatherData(cityName); // Şehir adına göre veri çekme işlemi
            }
            cityInput.value = ''; // Arama kutusunu temizle
            cityInput.blur(); // Odaktan çıkar
        }
    });

    cityInput.addEventListener("focus", function () {
        // Placeholder'a kaydırma sınıfını ekle
        if (!cityInput.value) {
            cityInput.classList.add("placeholder-hidden");
        }
    });

    cityInput.addEventListener("blur", function () {
        // Odak dışı olduğunda placeholder sınıfını kaldır
        if (!cityInput.value) {
            cityInput.classList.remove("placeholder-hidden");
        }
    });

    function fetchWeatherData(city) {
        city = city.trim(); // İlk harf büyük diğer harfler küçük
        city= city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();

        fetch(`/update-weather?city=${city}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert('Veri alınamadı: ' + data.error);
                    return;
                }
                if (islogin) {
                    fetchVisitedCityData(islogin); // Geçmiş aramaları göstert
                    updateVisitedCities(data.city_name); //Geçmiş aramaları güncelle
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
                document.getElementById('last-update').textContent = ` ${new Date(data.current_weather.güncelleme_zamanı).toLocaleString('tr-TR')}`;

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

                // Region Info güncelleme
                if (data.city_region) {
                    regionInfoElement.textContent = data.city_region;
                    regionInfoElement.style.display = 'block'; // Göster
                } else {
                    regionInfoElement.style.display = 'none'; // Gizle
                }

                updateHourlyChart(data); // saatlik grafiğe bilgileri gönderme
                populateTable(data); // Saatlik tabloyu doldur
                updateWeeklyForecast(data) //Haftalık tabloyu doldur
                updateWeeklyChart(data); // haftalık grafiğe bilgileri gönderme
                updateCityWeatherIconsAndTemperatures();

                const selectedElement = document.querySelector('.matches-group .selected a');
                const targetLang = selectedElement ? selectedElement.getAttribute('hreflang') : 'en';
                
                const description = document.getElementById('description');
                if (description) {
                    translateElementText(description, 'auto', targetLang); 
                }
    
                const regioninfo = document.getElementById('region-info');
                if (regioninfo) {
                    translateElementText(regioninfo, 'auto', targetLang);
                }

                const lastupdate = document.getElementById('last-update');
                if (lastupdate) {
                    translateElementText(lastupdate, 'auto', targetLang);
                }

            
            })
            .catch(error => console.error('Veri çekme hatası:', error));
    }

    /* saatlik tablo güncelleme fonksiyonu*/
    function populateTable(data) {
        // Saatlik tablodaki satırları oluştur
        weatherTbody.innerHTML = generateTableRows(data.hourly_weather);

        // İlk 8 satırı hariç diğer satırları gizle
        const rows = weatherTbody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            if (index >= 9) row.classList.add('hidden-row'); // 9. satırdan sonrasını gizle
        });

        toggleButton.dataset.expanded = "false"; // Gizli satırların gösterilmediğini belirt
    }

    function generateTableRows(hours) {
        return hours.map(hour => `
            <tr>
                <td>${hour.saat}</td>
                <td>${hour.sıcaklık}°C</td>
                <td>${hour.yağış_ihtimali}%</td>
                <td>${hour.yağış} mm</td>
                <td>${hour.basınç} hPa</td>
                <td>${hour.nem}%</td>
                <td>${hour.rüzgar} m/s</td>
            </tr>
        `).join('');
    }

    // "Gizli Verileri Göster/Gizle" butonunu işlevsel hale getirme
    toggleButton.addEventListener('click', toggleMoreData);

    function toggleMoreData() {
        const rows = weatherTbody.querySelectorAll('tr');
        if (toggleButton.dataset.expanded === "false") {
            // Gizli satırları göster
            rows.forEach(row => row.classList.remove('hidden-row'));
            toggleButton.textContent = "Sonraki 8 Saat"; // Buton metnini değiştir
            toggleButton.dataset.expanded = "true"; // Durumu güncelle
        } else {
            // Gizli satırları tekrar gizle
            rows.forEach((row, index) => {
                if (index >= 9) row.classList.add('hidden-row');
            });
            toggleButton.textContent = "Sonraki 24 Saat"; // Buton metnini değiştir
            toggleButton.dataset.expanded = "false"; // Durumu güncelle
    
            // Sayfayı yukarı kaydır
            const tablePosition = weatherTbody.getBoundingClientRect().top + window.pageYOffset - 180; // Sayfa konumunu düzeltme
            window.scrollTo({ top: tablePosition, behavior: 'smooth' }); // Yumuşak kaydırma
        }
    }
    

    //Saatlik grafik güncelleme fonksiyonu
    function updateHourlyChart(data) {
        const labels = data.hourly_weather.map(hour => hour.saat);
        const temperatures = data.hourly_weather.map(hour => hour.sıcaklık);

        hourlyChart.data.labels = labels;
        hourlyChart.data.datasets[0].data = temperatures;
        hourlyChart.update();
    }

    
    //Haftalık tablo güncelleme fonksiyonu
    function updateWeeklyForecast(data) {
        const forecastContainer = document.querySelector('.weekly-forecast');
        forecastContainer.innerHTML = ''; // Eski içerikleri temizle

        const todayIndex = new Date().getDay(); // Bugün hangi gün
        const orderedDays = getOrderedWeekDays(todayIndex === 0 ? 6 : todayIndex - 1); // Dinamik gün sıralaması

        data.weekly_weather.forEach((day, index) => {
            const iconPath = `${iconsBasePath}${day.hava_durumu_ikonu}.png`; // İkon yolunu oluştur

            const dayElement = `
            <div class="day">
                <p class="day-name">${orderedDays[index]}</p>
                <p class="date">${new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long' })}</p>
                <div class="temp-icon">
                    <img src="${iconPath}" alt="Hava Durumu İkonu">
                    <p class="temp">${day.gece_sıcaklık}°C / ${day.sabah_sıcaklık}°C</p>
                </div>
            </div>
        `;
            forecastContainer.innerHTML += dayElement;
        });
    }


    function getOrderedWeekDays(startDayIndex) {
        const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
        return [...days.slice(startDayIndex), ...days.slice(0, startDayIndex)];
    }


    //Haftalık grafik güncelleme fonksiyonu
    function updateWeeklyChart(data) {
        // Bugünden itibaren günlerin sırasını hesaplayan fonksiyon
        function getWeekDays() {
            const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
            const today = new Date().getDay(); // 0: Pazar, 1: Pazartesi, ..., 6: Cumartesi
            const orderedDays = [...days.slice(today === 0 ? 6 : today - 1), ...days.slice(0, today === 0 ? 6 : today - 1)];
            return orderedDays.slice(0, 5); // Haftalık verilerin uzunluğuna göre ilk 5 gün
        }
    
        const labels = getWeekDays(); // Bugünden itibaren günleri al
        const temperatures = data.weekly_weather.map(day => (day.sabah_sıcaklık + day.gece_sıcaklık) / 2);
    
        weeklyChart.data.labels = labels.slice(0, data.weekly_weather.length); // Veriler kadarını al
        weeklyChart.data.datasets[0].data = temperatures;
        weeklyChart.update();
    }
    

/* Kullanıcı hesaptan çıkışı */
document.getElementById('exitProfil').addEventListener('click', (event) => {
    event.preventDefault(); // Link varsayılan davranışını engelle
    closePopup('profilPopup'); // Popup'ı kapat
    setVisibility(false); // Kullanıcı çıkış yaptı, görünürlük ayarla
    islogin=""; //Kullanıcı çıkış yaptı
});



const cityWeatherElements = document.querySelectorAll('.city-weather'); // Tüm city-weather divlerini al

    // Tüm divlere tıklama olayı ekle
    cityWeatherElements.forEach(cityElement => {
        cityElement.addEventListener('click', () => {
            const cityName = cityElement.querySelector('p').textContent.trim(); // Şehir adını al
            if (cityName) {
                fetchWeatherData(cityName); // Şehir adına göre veri al
            }
        });
    });

    cityElements.forEach(cityElement => {
        cityElement.addEventListener('click', (event) => {
            event.preventDefault(); 
            const cityName = cityElement.querySelector('.city-name').textContent.trim();
            fetchWeatherData(cityName);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    function updateCityWeatherIconsAndTemperatures() {
        cityElements.forEach(cityElement => {
            const cityName = cityElement.querySelector('.city-name').textContent.trim();
            if (cityName) {
                // Şehir adıyla hava durumu verilerini çek
                fetch(`/update-weather?city=${cityName}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) {
                            console.error(`Hata: ${data.error}`);
                            return;
                        }

                        // İlgili şehir kutucuğunu güncelle
                        const iconElement = cityElement.querySelector('.city-icon');
                        const tempElement = cityElement.querySelector('.city-temperature');

                        if (iconElement && tempElement) {
                            iconElement.src = data.current_weather.hava_durumu_ikonu;
                            iconElement.alt = data.current_weather.hava_durumu_bilgisi;
                            tempElement.textContent = `${data.current_weather.sıcaklık}°C`;
                        }
                    })
                    .catch(error => console.error(`Hava durumu güncellenirken hata: ${cityName}`, error));
            }
        });
    }

        //Başa dön butonu
    document.getElementById('to_top').addEventListener('click', function () {
        window.scrollTo({
        top: 0,
        behavior: 'smooth', // Yumuşak kaydırma
        });
    });

    // Başa dön ikonu sayfa hareket kontrolü
    window.addEventListener('scroll', function () {
        const toTopButton = document.getElementById('to_top');
        // Eğer sayfa 200px'lik kısımdan daha aşağıdaysa, butonu göster
        if (window.scrollY > 200) {
        toTopButton.style.display = 'flex'; // Butonu göster
        } else {
        toTopButton.style.display = 'none'; // Butonu gizle
        }
    });

    // Dil kutusuna tıklanınca matches görünürlüğünü aç/kapat
    languageSelector.addEventListener('click', function (event) {
        const clickedElement = event.target; // Tıklanan ögeyi al
        const isInsideMatches = clickedElement.closest('.matches'); // Tıklanan öge matches sınıfının içinde mi?
        const isLink = clickedElement.tagName === 'A'; // Tıklanan öge bir link mi?
        
        // Eğer tıklanan matches içindeki bir linkse görünürlüğü kapat
        if (isInsideMatches && isLink) {
            matches.style.display = 'none';
        } 
        // Eğer tıklanan matches'in kendisi ancak bir link değilse, hiçbir şey yapma
        else if (isInsideMatches && !isLink) {
            return;
        } 
        // Tıklanan matches değilse ve languageSelector ise, görünürlüğü aç/kapat
        else {
            matches.style.display = matches.style.display === 'block' ? 'none' : 'block';
        }
    });
    

    // Dil ekranı dışında bir yere tıklanırsa matches'i kapat
    document.addEventListener('click', function (event) {
        if (matches.style.display === 'block' && !matches.contains(event.target) && !languageSelector.contains(event.target)) {
            matches.style.display = 'none';
        }
    });

    //---Sayfa Çevirisi
    function translatePage(sourceLang, targetLang) {
        // Tüm metin düğümlerini bul
        const textNodes = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while ((node = walker.nextNode())) {
            if (node.nodeValue.trim()) {
                textNodes.push(node);
            }
        }
    
        // Çeviri için tüm metinleri topla
        const texts = textNodes.map(node => node.nodeValue);
    
        // Her bir metni çevir ve DOM'u güncelle
        texts.forEach((text, index) => {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
            
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    textNodes[index].nodeValue = data[0][0][0];
                })
                .catch(error => {
                    console.error(`"${text}" metni çevrilemedi:`, error);
                });
                updateSettingElement(targetLang);
        });

        //  popup sınıfındaki placeholder'ları çevir
        const popups = document.querySelectorAll('.popup');
        popups.forEach(popup => {
            const placeholders = popup.querySelectorAll('input[placeholder]');
            placeholders.forEach(input => {
                translateElementText(input, sourceLang, targetLang);
            });
        });

        // city-input id'sine sahip öğenin placeholder'ını çevir
        const cityInput = document.getElementById('city-input');
        if (cityInput && cityInput.placeholder) {
            translateElementText(cityInput, sourceLang, targetLang);
        }


    }

    function translateElementText(element, sourceLang, targetLang) {
        const originalText = element.placeholder || element.innerHTML;
        if (originalText) {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(originalText)}`;

            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    const translatedText = data[0][0][0];
                    if (element.placeholder !== undefined) {
                        element.placeholder = translatedText;
                    } else {
                        element.innerHTML = translatedText;
                    }
                })
                .catch(error => {
                    console.error(`"${originalText}" metni çevrilemedi:`, error);
                });
        }
    }
    
    // Kullanıcı bir dil seçtiğinde çağır
    document.querySelectorAll('.matches-group a').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const targetLang = link.getAttribute('hreflang'); // Seçilen dil
            const selectedElement = document.querySelector('.matches-group .selected a');
            const sourceLang = selectedElement ? selectedElement.getAttribute('hreflang') : 'auto';
            
            translatePage(sourceLang, targetLang);
            updateSelectedClass(targetLang);
        });
    });

    function updateSelectedClass(targetLang) { //dil değişiminde selected sınıfı

        // Mevcut 'selected' sınıfını kaldır
        const currentSelected = document.querySelector('.matches-group .selected');
        if (currentSelected) {
            currentSelected.classList.remove('selected');
        }
    
        // Yeni 'selected' sınıfını ekle
        const matchingLink = document.querySelector(`.matches-group a[hreflang="${targetLang}"]`);
        if (matchingLink) {
            matchingLink.parentElement.classList.add('selected');
        }
    }

    function updateSettingElement(targetLang) { //seçili dilin butonda gözükmesi
        const settingElement = document.getElementById('setting');
        if (settingElement) {
            settingElement.textContent = targetLang.toUpperCase(); // Dil kodunu büyük harflerle yaz
        }
    }

    const browserLang = navigator.language.split('-')[0]; // Tarayıcı dili (ör. "en-US" → "en")
    const selectedElement = document.querySelector('.matches-group .selected a');
    const sourceLang = selectedElement ? selectedElement.getAttribute('hreflang') : 'auto';
    translatePage(sourceLang, browserLang);
    updateSelectedClass(browserLang);
    updateSettingElement(browserLang);
    
});
/* --------------------------------DOMContentLoaded Bitişi--------------------------------- */


/* Popup görünürlüğünü açma*/
function openPopup(id) {
    document.getElementById(id).style.display = 'flex';
  
    // Metin kutularını temizle
    if (id === 'girisPopup') {
        document.getElementById("email").value = ""; // Giriş için eposta
        document.getElementById("password").value = ""; // Giriş için şifre
    } else if (id === 'kayitPopup') {
        document.getElementById("newUsername").value = ""; // Kayıt için kullanıcı adı
        document.getElementById("newEmail").value = ""; // Kayıt için eposta
        document.getElementById("newPassword").value = ""; // Kayıt için şifre
    } else if (id === 'profilPopup') {
        if (islogin) {
            fetch(`/get-user-info?email=${encodeURIComponent(islogin)}`)
                .then(response => response.json())
                .then(data => {
                    if (data) {  
                        document.getElementById("profilUserName").textContent = `Kullanıcı adı: ${data.user_name}`; 
                        document.getElementById("profilUserEmail").textContent = `Eposta: ${data.e_mail}`;  
                    } else {
                        alert("Kullanıcı bilgileri alınamadı.");
                    }
                })
                .catch(error => console.error("Profil bilgileri alınırken hata oluştu:", error));
        } else {
            alert("Giriş yapmamışsınız!");
        }
    }
  }
  
  /* Popup görünürlüğünü kapatma*/
  function closePopup(id) {
    document.getElementById(id).style.display = 'none';
  }


  /* Kayıt fonksiyonu */
  async function submitRegistration() {
    const user_name = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value.trim();
    const e_mail = document.getElementById('newEmail').value.trim();

    if (!user_name || !password || !e_mail) {
        alert('Lütfen tüm alanları doldurun.');
        return;
    }

    // Kullanıcı adı kontrolü (min 5 karakter)
    if (user_name.length < 5) {
        alert('Kullanıcı adı en az 5 karakter olmalı.');
        return;
    }

    // Şifre kontrolü (min 8 karakter)
    if (password.length < 8) {
        alert('Şifre en az 8 karakter olmalı.');
        return;
    }

    // Kullanıcı adı ve şifre aynı olmamalı
    if (user_name === password) {
        alert('Kullanıcı adı ve şifre aynı olamaz.');
        return;
    }

    // E-posta kontrolü
    const emailRegex = /^(?:[a-zA-Z0-9._%+-]+)@(gmail\.com|hotmail\.com)$/;
    if (!emailRegex.test(e_mail)) {
        alert('E-posta sadece @gmail.com veya @hotmail.com ile bitmeli.');
        return;
    }

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_name, password, e_mail })
        });

        const data = await response.json();

        if (response.ok) {
            islogin = e_mail; // Kullanıcının giriş durumu güncelleniyor
            closePopup('kayitPopup');
            setVisibility(true);
            fetchVisitedCityData(e_mail);
        } else {
            alert(data.error || 'Bir hata oluştu.');
        }
    } catch (error) {
        console.error('Kayıt hatası:', error);
        alert('Bir hata oluştu.');
    }
}

/* Giriş fonksiyonu */
async function submitLogin() {
    const e_mail = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!e_mail || !password) {
        alert('Lütfen tüm alanları doldurun.');
        return;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ e_mail, password })
        });

        const data = await response.json();

        if (response.ok) {
            islogin = e_mail; // Kullanıcının giriş durumu güncelleniyor
            setVisibility(true);
            closePopup('girisPopup');
            fetchVisitedCityData(e_mail);
        } else {
            alert(data.error || 'Bir hata oluştu.');
        }
    } catch (error) {
        console.error('Giriş hatası:', error);
        alert('Bir hata oluştu.');
    }
}

/* Giriş yapılınca butonları ayarlama */
function setVisibility(isLoggedIn) {
    const profilButton = document.getElementById('profilbutton');
    const settingsButton = document.getElementById('settingsbutton');
    const loginButton = document.getElementById('loginbutton');
    const submitButton = document.getElementById('submitbutton');
    const cityWeatherStrip = document.querySelector('.city-weather-strip');

    if (isLoggedIn) {
        profilButton.style.display = 'inline-block'; // Profil butonu görünür
        settingsButton.style.display = 'inline-block'; // Ayarlar butonu görünür
        loginButton.style.display = 'none'; // Giriş butonu gizli
        submitButton.style.display = 'none'; // Kayıt ol butonu gizli
    } else {
        profilButton.style.display = 'none'; // Profil butonu gizli
        settingsButton.style.display = 'none'; // Ayarlar butonu görünür
        loginButton.style.display = 'inline-block'; // Giriş butonu görünür
        submitButton.style.display = 'inline-block'; // Kayıt ol butonu görünür
        cityWeatherStrip.style.display = 'none'; // Şehir hava durumu gizli
    }
}

// Kullanıcının visited_city bilgilerini al ve HTML'e yerleştir
async function fetchVisitedCityData(email) {
    try {
        const response = await fetch(`/get-user-weather?email=${encodeURIComponent(email)}`);
        if (!response.ok) {
            throw new Error('Sunucu hatası veya yanlış yanıt alındı.');
        }

        const visitedCitiesData = await response.json();
        updateCityWeather(visitedCitiesData); // Verileri HTML'e yerleştir
    } catch (error) {
        console.error('Hata oluştu:', error);
    }
}

// Kullanıcının visited_city bilgilerini al ve HTML'e yerleştir devamı
function updateCityWeather(visitedCitiesData) {
    const cityElements = Array.from(document.querySelectorAll('.city-weather'));

    cityElements.forEach((cityElement, index) => {
        const cityData = visitedCitiesData[index];

        if (cityData) {
            // Şehir verileri mevcutsa bilgileri yerleştir
            cityElement.querySelector('p').textContent = cityData.city_name; // Şehir adı
            cityElement.querySelector('p + p').textContent = `${cityData.current_weather.sıcaklık}°C`; // Sıcaklık
            cityElement.querySelector('img').src = cityData.current_weather.hava_durumu_ikonu; // Hava durumu ikonu
            cityElement.querySelector('img').alt = cityData.current_weather.hava_durumu_bilgisi; // Alt metin
            const cityWeatherStrip = document.querySelector('.city-weather-strip');
            cityElement.style.display = 'block'; // Şehri görünür yap
            
            cityWeatherStrip.style.display = 'flex';
        } else {
            // Veri eksikse city divini gizle
            cityElement.style.display = 'none';
        }
    });
}


async function updateVisitedCities(city) {
    try {
        const response = await fetch('/update-visited-cities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: islogin, newCity: city })
        });

        if (!response.ok) {
            throw new Error('Visited cities güncellenemedi.');
        }

    } catch (error) {
        console.error('Hata oluştu:', error);
    }
}


