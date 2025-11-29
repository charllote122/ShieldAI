// API integration for ShieldAI
class ShieldAPI {
    static async analyzeText(text, platform = 'generic') {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                const score = Math.random();
                const isToxic = score > 0.7;
                
                resolve({
                    toxicity_score: score,
                    is_toxic: isToxic,
                    categories: isToxic ? this.detectCategories(text) : [],
                    confidence: Math.random() * 0.3 + 0.7,
                    response_time: Math.random() * 200 + 50
                });
            }, 300);
        });
    }

    static detectCategories(text) {
        const categories = [];
        const lowerText = text.toLowerCase();

        if (lowerText.includes('women') && (lowerText.includes('kitchen') || lowerText.includes('belong'))) {
            categories.push('gender_harassment');
        }
        if (lowerText.includes('hate') || lowerText.includes('stupid') || lowerText.includes('ugly')) {
            categories.push('harassment');
        }
        if (lowerText.includes('kill') || lowerText.includes('hurt')) {
            categories.push('threats');
        }

        return categories.length > 0 ? categories : ['safe_content'];
    }

    static async getSupportResources(location = 'africa') {
        // Simulate fetching support resources
        return {
            hotlines: CONFIG.EMERGENCY_CONTACTS,
            organizations: [
                {
                    name: 'Women\'s Legal Aid Centre',
                    phone: '0800 123 456',
                    website: 'wlac.org'
                }
            ],
            online_resources: [
                {
                    title: 'Digital Safety Guide',
                    url: '#',
                    type: 'pdf'
                }
            ]
        };
    }
}