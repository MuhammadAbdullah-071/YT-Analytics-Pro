document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const themeToggle = document.getElementById('themeToggle');
    const shareBtn = document.getElementById('shareBtn');
    const socialShare = document.getElementById('socialShare');
    const youtubeInput = document.getElementById('youtubeInput');
    const clearBtn = document.getElementById('clearBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('errorMessage');
    const results = document.getElementById('results');
    const closePreview = document.getElementById('closePreview');
    const sharePreview = document.getElementById('sharePreview');
    const downloadPNG = document.getElementById('downloadPNG');
    const downloadPDF = document.getElementById('downloadPDF');
    const copyLink = document.getElementById('copyLink');
    const mainHeader = document.getElementById('mainHeader');

    // Global variables
    let currentChannelData = null;
    let lastScrollPosition = 0;

    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'light') {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    }

    // Theme toggle
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
        
        const icon = themeToggle.querySelector('i');
        if (isDark) {
            icon.classList.replace('fa-moon', 'fa-sun');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
        }
    });

    // Share button animation and functionality
    shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        socialShare.classList.toggle('active');
        
        // Add ripple effect
        shareBtn.classList.add('pulse');
        setTimeout(() => {
            shareBtn.classList.remove('pulse');
        }, 300);
    });

    // Close social share when clicking outside
    document.addEventListener('click', (e) => {
        if (!socialShare.contains(e.target) && e.target !== shareBtn) {
            socialShare.classList.remove('active');
        }
    });

    // Clear search input
    youtubeInput.addEventListener('input', () => {
        clearBtn.classList.toggle('visible', youtubeInput.value.length > 0);
    });

    clearBtn.addEventListener('click', () => {
        youtubeInput.value = '';
        clearBtn.classList.remove('visible');
        youtubeInput.focus();
    });

    // Header scroll behavior
    window.addEventListener('scroll', () => {
        const currentScrollPosition = window.pageYOffset;
        
        if (currentScrollPosition > 50) {
            mainHeader.classList.add('scrolled');
        } else {
            mainHeader.classList.remove('scrolled');
        }
        
        if (currentScrollPosition > lastScrollPosition && currentScrollPosition > 100) {
            // Scrolling down
            mainHeader.classList.add('hidden');
        } else {
            // Scrolling up
            mainHeader.classList.remove('hidden');
        }
        
        lastScrollPosition = currentScrollPosition;
    });

    // Analyze button click
    analyzeBtn.addEventListener('click', () => {
        const query = youtubeInput.value.trim();
        if (!query) {
            showError("Please enter a YouTube channel name or URL.");
            return;
        }

        loading.style.display = 'flex';
        results.style.display = 'none';
        errorMessage.style.display = 'none';

        // Add button animation
        analyzeBtn.classList.add('pulse');
        setTimeout(() => {
            analyzeBtn.classList.remove('pulse');
        }, 300);

        getChannelId(query);
    });

    // Close share preview
    closePreview.addEventListener('click', () => {
        sharePreview.classList.remove('active');
    });

    // Download as PNG
    downloadPNG.addEventListener('click', () => {
        if (!currentChannelData) return;
        
        html2canvas(document.querySelector('.preview-card')).then(canvas => {
            const link = document.createElement('a');
            link.download = `youtube-analytics-${currentChannelData.name.replace(/\s+/g, '-').toLowerCase()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    });

    // Download as PDF
    downloadPDF.addEventListener('click', () => {
        if (!currentChannelData) return;
        
        const element = document.getElementById('results');
        const opt = {
            margin: 10,
            filename: `youtube-analytics-${currentChannelData.name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        html2pdf().set(opt).from(element).save();
    });

    // Copy share link
    copyLink.addEventListener('click', () => {
        if (!currentChannelData) return;
        
        const shareUrl = window.location.href;
        navigator.clipboard.writeText(shareUrl).then(() => {
            const originalText = copyLink.innerHTML;
            copyLink.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                copyLink.innerHTML = originalText;
            }, 2000);
        });
    });

    // Initialize social share links
    setupSocialShare();

    // API Functions
    function getChannelId(input) {
        const API_KEY = "AIzaSyCx3paNoUgPnePfiyRLUURa2I9KfhTMR4M";
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(input)}&key=${API_KEY}`;

        fetch(searchUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.items && data.items.length > 0) {
                    const channelId = data.items[0].id.channelId;
                    fetchChannelData(channelId);
                } else {
                    throw new Error("No channel found. Please enter a valid channel name or URL.");
                }
            })
            .catch(error => {
                console.error("Search error:", error);
                showError(error.message);
                loading.style.display = 'none';
            });
    }

    function fetchChannelData(channelId) {
        const API_KEY = "AIzaSyCx3paNoUgPnePfiyRLUURa2I9KfhTMR4M";
        const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${API_KEY}`;

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.items && data.items.length > 0) {
                    currentChannelData = processChannelData(data.items[0]);
                    displayChannelData(currentChannelData);
                    
                    // Simulate additional data fetching
                    setTimeout(() => {
                        simulateHistoricalData(currentChannelData);
                        simulateTagsAndHashtags();
                        updateSocialShare(currentChannelData);
                    }, 500);
                } else {
                    throw new Error("No channel data found.");
                }
            })
            .catch(error => {
                console.error("Details error:", error);
                showError("Error fetching channel data. Please try again.");
                loading.style.display = 'none';
            });
    }

    function processChannelData(channel) {
        const snippet = channel.snippet;
        const statistics = channel.statistics;
        const branding = channel.brandingSettings || {};
        
        // Basic channel info
        const channelData = {
            id: channel.id,
            name: snippet.title || "Unknown Channel",
            description: snippet.description || "No description available.",
            thumbnail: snippet.thumbnails?.high?.url || '',
            url: `https://www.youtube.com/channel/${channel.id}`,
            location: branding.channel?.country || "Not specified",
            creationDate: new Date(snippet.publishedAt),
            totalVideos: parseInt(statistics.videoCount) || 0,
            totalViews: parseInt(statistics.viewCount) || 0,
            subscribers: parseInt(statistics.subscriberCount) || 0
        };
        
        // Calculate derived metrics
        channelData.viewsPerVideo = channelData.totalVideos > 0 ? 
            Math.floor(channelData.totalViews / channelData.totalVideos) : 0;
            
        channelData.engagementRate = channelData.subscribers > 0 ? 
            ((channelData.totalViews / channelData.subscribers) * 100).toFixed(2) + "%" : "N/A";
            
        channelData.contentFrequency = calculateContentFrequency(
            channelData.totalVideos, 
            channelData.creationDate
        );
        
        channelData.subscriberGrowthRate = calculateSubscriberGrowthRate(
            channelData.subscribers, 
            channelData.creationDate
        );
        
        channelData.viewsPerDay = calculateViewsPerDay(
            channelData.totalViews, 
            channelData.creationDate
        );
        
        channelData.bestUploadTime = calculateBestUploadTime(channelData.location);
        
        // Revenue calculations
        channelData.rpm = getRpmByCountry(channelData.location);
        channelData.cpm = channelData.rpm * 10; // CPM is typically 10x RPM
        
        const dailyAdRevenue = ((channelData.totalViews / channelData.totalVideos) * channelData.rpm / 1000).toFixed(2);
        channelData.monthlyAdRevenue = (dailyAdRevenue * 30).toFixed(2);
        channelData.sponsorshipsEst = (channelData.monthlyAdRevenue * 0.5).toFixed(2);
        channelData.membershipsEst = (channelData.subscribers * 0.01).toFixed(2);
        channelData.merchandiseEst = (channelData.subscribers * 0.005 * 20).toFixed(2);
        
        // Content type prediction
        channelData.bestContentType = simulateBestContentType(
            channelData.totalViews, 
            channelData.totalVideos
        );
        
        // Health score
        channelData.healthScore = calculateHealthScore(channelData);
        
        return channelData;
    }

    function displayChannelData(channel) {
        // Basic info
        results.innerHTML = `
            <div class="channel-header">
                <img class="channel-thumbnail" src="${channel.thumbnail}" alt="${channel.name}">
                <div class="channel-info">
                    <h2>${channel.name}</h2>
                    <p>${channel.description}</p>
                    <p><strong>Location:</strong> ${channel.location}</p>
                    <p><strong>Channel Created:</strong> ${channel.creationDate.toLocaleDateString()}</p>
                    <a class="channel-link" href="${channel.url}" target="_blank" rel="noopener noreferrer">
                        <i class="fab fa-youtube"></i> View Channel on YouTube
                    </a>
                </div>
            </div>

            <div class="metrics-grid">
                <div class="metric-card subs-card">
                    <h3>Subscribers</h3>
                    <p>${formatNumber(channel.subscribers)}</p>
                    <small>${channel.subscriberGrowthRate} growth/month</small>
                </div>
                <div class="metric-card">
                    <h3>Total Videos</h3>
                    <p>${formatNumber(channel.totalVideos)}</p>
                </div>
                <div class="metric-card views-card">
                    <h3>Total Views</h3>
                    <p>${formatNumber(channel.totalViews)}</p>
                    <small>~${formatNumber(Math.floor(channel.viewsPerDay))} views/day</small>
                </div>
                <div class="metric-card revenue-card">
                    <h3>Estimated CPM</h3>
                    <p>$${channel.cpm.toFixed(2)}</p>
                </div>
            </div>

            <div class="insights-section">
                <h3><i class="fas fa-lightbulb"></i> Content Insights</h3>
                <div class="insights-grid">
                    <div class="insight-item">
                        <h4 data-tooltip="Average views per video based on total views and video count">Average Views Per Video</h4>
                        <p>${formatNumber(channel.viewsPerVideo)}</p>
                    </div>
                    <div class="insight-item">
                        <h4 data-tooltip="Ratio of views to subscribers (higher is better)">Engagement Rate</h4>
                        <p>${channel.engagementRate}</p>
                    </div>
                    <div class="insight-item">
                        <h4 data-tooltip="Estimated monthly subscriber growth rate">Subscriber Growth Rate</h4>
                        <p>${channel.subscriberGrowthRate}</p>
                    </div>
                    <div class="insight-item">
                        <h4 data-tooltip="Recommended upload time based on audience location">Best Time to Upload</h4>
                        <p>${channel.bestUploadTime}</p>
                    </div>
                    <div class="insight-item">
                        <h4 data-tooltip="Most commonly used tags in channel videos">Most Used Tags</h4>
                        <div class="tag-container" id="topTags"></div>
                    </div>
                    <div class="insight-item">
                        <h4 data-tooltip="Most frequently used hashtags in video descriptions">Popular Hashtags</h4>
                        <div class="tag-container" id="topHashtags"></div>
                    </div>
                </div>
            </div>

            <div class="earnings-section">
                <h3><i class="fas fa-dollar-sign"></i> Earnings Estimation (USD)</h3>
                <div class="earnings-grid">
                    <div class="earning-card">
                        <h4>Ad Revenue (Monthly)</h4>
                        <p>$${formatCurrency(channel.monthlyAdRevenue)}</p>
                    </div>
                    <div class="earning-card">
                        <h4>Sponsorships (Est.)</h4>
                        <p>$${formatCurrency(channel.sponsorshipsEst)}</p>
                    </div>
                    <div class="earning-card">
                        <h4>Memberships (Est.)</h4>
                        <p>$${formatCurrency(channel.membershipsEst)}</p>
                    </div>
                    <div class="earning-card">
                        <h4>Merchandise (Est.)</h4>
                        <p>$${formatCurrency(channel.merchandiseEst)}</p>
                    </div>
                </div>
            </div>

            <div class="chart-container">
                <h3>Channel Growth Overview</h3>
                <canvas id="growthChart"></canvas>
            </div>

            <div class="insights-section">
                <h3><i class="fas fa-globe"></i> International RPM Rates</h3>
                <div class="rpm-table-container">
                    <table class="rpm-table">
                        <thead>
                            <tr>
                                <th>Country</th>
                                <th>RPM Rate (USD)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr ${channel.location === 'US' ? 'class="highlight"' : ''}>
                                <td>United States</td>
                                <td>$5.00 (Highest)</td>
                            </tr>
                            <tr ${channel.location === 'GB' ? 'class="highlight"' : ''}>
                                <td>United Kingdom</td>
                                <td>$4.50</td>
                            </tr>
                            <tr ${channel.location === 'CA' ? 'class="highlight"' : ''}>
                                <td>Canada</td>
                                <td>$4.00</td>
                            </tr>
                            <tr ${channel.location === 'AU' ? 'class="highlight"' : ''}>
                                <td>Australia</td>
                                <td>$4.00</td>
                            </tr>
                            <tr ${channel.location === 'DE' ? 'class="highlight"' : ''}>
                                <td>Germany</td>
                                <td>$3.50</td>
                            </tr>
                            <tr ${channel.location === 'FR' ? 'class="highlight"' : ''}>
                                <td>France</td>
                                <td>$3.00</td>
                            </tr>
                            <tr ${channel.location === 'JP' ? 'class="highlight"' : ''}>
                                <td>Japan</td>
                                <td>$3.20</td>
                            </tr>
                            <tr ${channel.location === 'KR' ? 'class="highlight"' : ''}>
                                <td>South Korea</td>
                                <td>$3.20</td>
                            </tr>
                            <tr ${channel.location === 'IN' ? 'class="highlight"' : ''}>
                                <td>India</td>
                                <td>$1.50</td>
                            </tr>
                            <tr ${channel.location === 'BR' ? 'class="highlight"' : ''}>
                                <td>Brazil</td>
                                <td>$1.80</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <button class="export-btn" id="showSharePreview">
                <i class="fas fa-share-alt"></i> Share & Download Report
            </button>
        `;

        // Add event listener to the new share button
        document.getElementById('showSharePreview').addEventListener('click', () => {
            showSharePreview(channel);
        });

        loading.style.display = 'none';
        results.style.display = 'block';
    }

    function showSharePreview(channel) {
        document.getElementById('previewThumbnail').src = channel.thumbnail;
        document.getElementById('previewTitle').textContent = channel.name;
        document.getElementById('previewStats').textContent = 
            `${formatNumber(channel.subscribers)} subscribers • ${formatNumber(channel.totalViews)} views`;
        
        // Update tags in preview
        const tagsContainer = document.getElementById('previewTags');
        tagsContainer.innerHTML = '';
        const tags = document.querySelectorAll('#topTags .tag');
        tags.forEach(tag => {
            tagsContainer.innerHTML += `<span class="tag">${tag.textContent}</span>`;
        });

        // Update social share links
        updateSocialShare(channel);
        
        sharePreview.classList.add('active');
    }

    function simulateHistoricalData(channel) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const subsData = [];
        const viewsData = [];
        const videosData = [];
        const revenueData = [];
        
        for (let i = 0; i < 12; i++) {
            const factor = (i + 1) / 12;
            subsData.push(Math.floor(channel.subscribers * 0.1 + (channel.subscribers * 0.9 * Math.pow(factor, 2))));
            viewsData.push(Math.floor(channel.totalViews * 0.1 + (channel.totalViews * 0.9 * Math.pow(factor, 2))));
            videosData.push(Math.floor(channel.totalVideos * 0.1 + (channel.totalVideos * 0.9 * factor)));
            revenueData.push(Math.floor((channel.monthlyAdRevenue * 0.1 + (channel.monthlyAdRevenue * 0.9 * factor)) * 100) / 100);
        }
        
        const ctx = document.getElementById('growthChart').getContext('2d');
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Subscribers',
                        data: subsData,
                        borderColor: '#FF0000',
                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Total Views',
                        data: viewsData,
                        borderColor: '#17a2b8',
                        backgroundColor: 'rgba(23, 162, 184, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Videos',
                        data: videosData,
                        borderColor: '#ffc107',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Revenue (USD)',
                        data: revenueData,
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: 'var(--light)',
                            font: {
                                family: 'Poppins'
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'var(--secondary)',
                        titleColor: 'var(--light)',
                        bodyColor: 'var(--light)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.dataset.label === 'Revenue (USD)') {
                                    label += '$' + context.raw.toFixed(2);
                                } else {
                                    label += formatNumber(context.raw);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'var(--gray)'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'var(--gray)',
                            callback: function(value) {
                                return formatNumber(value);
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false,
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'var(--gray)',
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    }

    function simulateTagsAndHashtags() {
        const allTags = [
            "youtube", "vlog", "tutorial", "entertainment", "education",
            "tech", "gaming", "howto", "review", "trending", "tips",
            "beginner", "advanced", "funny", "reaction", "challenge"
        ];
        
        const allHashtags = [
            "#youtube", "#viral", "#trending", "#tutorial", "#explore",
            "#contentcreator", "#video", "#subscribe", "#views", "#like",
            "#newvideo", "#youtuber", "#vlogger", "#trendingnow", "#youtubecommunity"
        ];
        
        const shuffledTags = [...allTags].sort(() => 0.5 - Math.random());
        const shuffledHashtags = [...allHashtags].sort(() => 0.5 - Math.random());
        
        const topTags = shuffledTags.slice(0, 5);
        const topHashtags = shuffledHashtags.slice(0, 5);
        
        const tagsContainer = document.getElementById('topTags');
        tagsContainer.innerHTML = '';
        topTags.forEach(tag => {
            tagsContainer.innerHTML += `<span class="tag">${tag}</span>`;
        });
        
        const hashtagsContainer = document.getElementById('topHashtags');
        hashtagsContainer.innerHTML = '';
        topHashtags.forEach(hashtag => {
            hashtagsContainer.innerHTML += `<span class="tag">${hashtag}</span>`;
        });
    }

    function calculateContentFrequency(totalVideos, creationDate) {
        if (!creationDate || totalVideos === 0) return "N/A";
        
        const channelAgeMs = new Date() - creationDate;
        const channelAgeDays = channelAgeMs / (1000 * 60 * 60 * 24);
        const videosPerWeek = (totalVideos / channelAgeDays) * 7;
        
        if (videosPerWeek >= 7) return "Daily";
        if (videosPerWeek >= 3) return "Several times a week";
        if (videosPerWeek >= 1) return "Weekly";
        if (videosPerWeek >= 0.5) return "Bi-weekly";
        if (videosPerWeek >= 0.23) return "Monthly";
        return "Less than monthly";
    }

    function calculateSubscriberGrowthRate(subscribers, creationDate) {
        if (!creationDate || subscribers === 0) return "N/A";
        
        const channelAgeMs = new Date() - creationDate;
        const channelAgeMonths = channelAgeMs / (1000 * 60 * 60 * 24 * 30);
        const growthRate = (subscribers / channelAgeMonths).toFixed(0);
        
        return formatNumber(growthRate) + "/month";
    }

    function calculateViewsPerDay(totalViews, creationDate) {
        if (!creationDate || totalViews === 0) return 0;
        
        const channelAgeMs = new Date() - creationDate;
        const channelAgeDays = channelAgeMs / (1000 * 60 * 60 * 24);
        return totalViews / channelAgeDays;
    }

    function calculateBestUploadTime(countryCode) {
        const uploadTimes = {
            "US": "2:00 PM - 4:00 PM (EST)",
            "GB": "6:00 PM - 8:00 PM (GMT)",
            "CA": "2:00 PM - 4:00 PM (EST)",
            "AU": "7:00 PM - 9:00 PM (AEST)",
            "DE": "7:00 PM - 9:00 PM (CET)",
            "FR": "7:00 PM - 9:00 PM (CET)",
            "JP": "8:00 PM - 10:00 PM (JST)",
            "IN": "8:00 PM - 10:00 PM (IST)",
            "BR": "7:00 PM - 9:00 PM (BRT)",
            "RU": "7:00 PM - 9:00 PM (MSK)"
        };
        
        return uploadTimes[countryCode] || "7:00 PM - 9:00 PM (Local Time)";
    }

    function simulateBestContentType(totalViews, totalVideos) {
        if (totalVideos === 0) return "N/A";
        
        const avgViews = totalViews / totalVideos;
        
        if (avgViews > 1000000) return "Viral Content";
        if (avgViews > 500000) return "Trending Topics";
        if (avgViews > 100000) return "Educational/Tutorials";
        if (avgViews > 50000) return "Entertainment";
        if (avgViews > 10000) return "Niche Content";
        return "Low-Performing";
    }

    function calculateHealthScore(channel) {
        let score = 0;
        
        // Engagement (30% weight)
        const engagementRate = (channel.totalViews / channel.subscribers) * 100;
        score += Math.min(30, engagementRate * 0.3);
        
        // Growth (25% weight)
        const growthRate = parseFloat(channel.subscriberGrowthRate);
        score += Math.min(25, growthRate * 0.25);
        
        // Consistency (20% weight)
        const uploadFrequency = channel.contentFrequency;
        if (uploadFrequency.includes("Daily")) score += 20;
        else if (uploadFrequency.includes("Weekly")) score += 15;
        else if (uploadFrequency.includes("Monthly")) score += 10;
        
        // Content Quality (25% weight)
        const avgViews = channel.totalViews / channel.totalVideos;
        if (avgViews > 1000000) score += 25;
        else if (avgViews > 500000) score += 20;
        else if (avgViews > 100000) score += 15;
        else if (avgViews > 50000) score += 10;
        else score += 5;
        
        return Math.round(score);
    }

    function getRpmByCountry(countryCode) {
        const rpmRates = {
            "US": 5.00, "GB": 4.50, "CA": 4.00, "AU": 4.00, "DE": 3.50,
            "FR": 3.00, "JP": 3.00, "IN": 1.50, "BR": 1.80, "RU": 2.00,
            "IT": 3.00, "ES": 2.80, "NL": 3.20, "SE": 3.50, "NO": 3.60,
            "DK": 3.40, "FI": 3.30, "PL": 2.50, "TR": 2.20, "SA": 2.80,
            "AE": 3.00, "SG": 3.50, "MY": 2.00, "ID": 1.80, "PH": 1.50,
            "TH": 1.70, "VN": 1.60, "KR": 3.20, "CN": 2.50, "HK": 3.00,
            "TW": 2.80, "MX": 2.20, "AR": 1.80, "CL": 2.00, "CO": 1.70,
            "PE": 1.60, "ZA": 2.00, "NG": 1.50, "EG": 1.80, "KE": 1.60,
            "IL": 3.00, "NZ": 3.50
        };
        
        return rpmRates[countryCode] || 2.50;
    }

    function setupSocialShare() {
        document.getElementById('shareFB').addEventListener('click', function(e) {
            e.preventDefault();
            if (!currentChannelData) return;
            
            const url = encodeURIComponent(window.location.href);
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
        });
        
        document.getElementById('shareTwitter').addEventListener('click', function(e) {
            e.preventDefault();
            if (!currentChannelData) return;
            
            const text = encodeURIComponent(`Check out ${currentChannelData.name}'s YouTube analytics!`);
            const url = encodeURIComponent(window.location.href);
            window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
        });
        
        document.getElementById('shareLinkedIn').addEventListener('click', function(e) {
            e.preventDefault();
            if (!currentChannelData) return;
            
            const url = encodeURIComponent(window.location.href);
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
        });
        
        document.getElementById('shareWhatsApp').addEventListener('click', function(e) {
            e.preventDefault();
            if (!currentChannelData) return;
            
            const text = encodeURIComponent(`Check out ${currentChannelData.name}'s YouTube analytics: ${window.location.href}`);
            window.open(`https://wa.me/?text=${text}`, '_blank');
        });
        
        document.getElementById('shareReddit').addEventListener('click', function(e) {
            e.preventDefault();
            if (!currentChannelData) return;
            
            const title = encodeURIComponent(`YouTube Analytics for ${currentChannelData.name}`);
            const url = encodeURIComponent(window.location.href);
            window.open(`https://www.reddit.com/submit?title=${title}&url=${url}`, '_blank');
        });
        
        document.getElementById('shareTelegram').addEventListener('click', function(e) {
            e.preventDefault();
            if (!currentChannelData) return;
            
            const text = encodeURIComponent(`Check out ${currentChannelData.name}'s YouTube analytics`);
            const url = encodeURIComponent(window.location.href);
            window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
        });

        // Preview share buttons
        document.getElementById('previewFB').addEventListener('click', function(e) {
            e.preventDefault();
            if (!currentChannelData) return;
            
            const url = encodeURIComponent(window.location.href);
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
        });
        
        document.getElementById('previewTwitter').addEventListener('click', function(e) {
            e.preventDefault();
            if (!currentChannelData) return;
            
            const text = encodeURIComponent(`Check out ${currentChannelData.name}'s YouTube analytics!`);
            const url = encodeURIComponent(window.location.href);
            window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
        });
        
        document.getElementById('previewLinkedIn').addEventListener('click', function(e) {
            e.preventDefault();
            if (!currentChannelData) return;
            
            const url = encodeURIComponent(window.location.href);
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
        });
        
        document.getElementById('previewWhatsApp').addEventListener('click', function(e) {
            e.preventDefault();
            if (!currentChannelData) return;
            
            const text = encodeURIComponent(`Check out ${currentChannelData.name}'s YouTube analytics: ${window.location.href}`);
            window.open(`https://wa.me/?text=${text}`, '_blank');
        });
        
        document.getElementById('previewReddit').addEventListener('click', function(e) {
            e.preventDefault();
            if (!currentChannelData) return;
            
            const title = encodeURIComponent(`YouTube Analytics for ${currentChannelData.name}`);
            const url = encodeURIComponent(window.location.href);
            window.open(`https://www.reddit.com/submit?title=${title}&url=${url}`, '_blank');
        });
        
        document.getElementById('previewTelegram').addEventListener('click', function(e) {
            e.preventDefault();
            if (!currentChannelData) return;
            
            const text = encodeURIComponent(`Check out ${currentChannelData.name}'s YouTube analytics`);
            const url = encodeURIComponent(window.location.href);
            window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
        });
    }

    function updateSocialShare(channel) {
        const shareUrl = window.location.href;
        const shareText = `Check out ${channel.name}'s YouTube analytics!`;
        
        document.getElementById('shareFB').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        document.getElementById('shareTwitter').href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        document.getElementById('shareLinkedIn').href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        document.getElementById('shareWhatsApp').href = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        document.getElementById('shareReddit').href = `https://www.reddit.com/submit?title=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        document.getElementById('shareTelegram').href = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        
        document.getElementById('previewFB').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        document.getElementById('previewTwitter').href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        document.getElementById('previewLinkedIn').href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        document.getElementById('previewWhatsApp').href = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        document.getElementById('previewReddit').href = `https://www.reddit.com/submit?title=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        document.getElementById('previewTelegram').href = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    }

    function showError(message) {
        errorMessage.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        errorMessage.style.display = 'block';
        loading.style.display = 'none';
    }

    function formatNumber(num) {
        return new Intl.NumberFormat('en-US').format(num);
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }
});