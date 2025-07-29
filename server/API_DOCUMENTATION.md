# Subscription Management API Documentation

## Base URL
```
http://localhost:3001
```

## Authentication
All endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Analytics Endpoints

### 1. Dashboard Summary
**GET** `/api/analytics/:userId/summary`

Returns overall metrics including total monthly/yearly spending and subscription count.

**Example Response:**
```json
{
  "totalSubscriptions": 8,
  "totalMonthly": 89.97,
  "totalYearly": 1079.64,
  "avgMonthlyCost": 11.25,
  "generatedAt": "2025-07-29T20:08:29.000Z"
}
```

### 2. Category Breakdown
**GET** `/api/analytics/:userId/categories`

Returns spending breakdown by category with subscription details.

**Example Response:**
```json
{
  "categories": [
    {
      "name": "Entertainment",
      "monthly": 45.98,
      "yearly": 551.76,
      "count": 4,
      "subscriptions": [
        {
          "id": "uuid-1",
          "name": "Netflix",
          "cost": 15.99,
          "billing_cycle": "monthly",
          "logo_url": "https://example.com/netflix-logo.png"
        }
      ]
    },
    {
      "name": "Productivity",
      "monthly": 29.99,
      "yearly": 359.88,
      "count": 2,
      "subscriptions": [
        {
          "id": "uuid-2",
          "name": "Microsoft 365",
          "cost": 9.99,
          "billing_cycle": "monthly",
          "logo_url": "https://example.com/microsoft-logo.png"
        }
      ]
    }
  ],
  "totalCategories": 2,
  "generatedAt": "2025-07-29T20:08:29.000Z"
}
```

### 3. Monthly Spending Trends
**GET** `/api/analytics/:userId/trends?months=6`

Returns monthly spending trends for the specified number of months.

**Query Parameters:**
- `months` (optional): Number of months to include (default: 6)

**Example Response:**
```json
{
  "trends": [
    {
      "month": "2025-02",
      "monthName": "February 2025",
      "total": 89.97,
      "subscriptionCount": 8,
      "projected": true
    },
    {
      "month": "2025-03",
      "monthName": "March 2025",
      "total": 92.47,
      "subscriptionCount": 9,
      "projected": false,
      "payments": [
        {
          "subscription": "Netflix",
          "amount": 15.99,
          "category": "Entertainment",
          "logo_url": "https://example.com/netflix-logo.png"
        }
      ]
    }
  ],
  "totalMonths": 6,
  "generatedAt": "2025-07-29T20:08:29.000Z"
}
```

### 4. Upcoming Renewals
**GET** `/api/analytics/:userId/upcoming?days=30`

Returns subscriptions renewing within the specified number of days.

**Query Parameters:**
- `days` (optional): Number of days to look ahead (default: 30)

**Example Response:**
```json
{
  "upcomingRenewals": [
    {
      "id": "uuid-1",
      "name": "Netflix",
      "cost": 15.99,
      "billing_cycle": "monthly",
      "next_payment_date": "2025-08-15",
      "category": "Entertainment",
      "logo_url": "https://example.com/netflix-logo.png",
      "daysUntilRenewal": 5
    }
  ],
  "totalUpcomingCost": 47.97,
  "count": 3,
  "generatedAt": "2025-07-29T20:08:29.000Z"
}
```

### 5. Most Expensive Subscriptions
**GET** `/api/analytics/:userId/expensive?limit=10`

Returns the most expensive subscriptions sorted by monthly cost.

**Query Parameters:**
- `limit` (optional): Number of subscriptions to return (default: 10)

**Example Response:**
```json
{
  "expensiveSubscriptions": [
    {
      "id": "uuid-1",
      "name": "Adobe Creative Cloud",
      "cost": 52.99,
      "billing_cycle": "monthly",
      "monthlyCost": 52.99,
      "yearlyCost": 635.88,
      "category": "Design",
      "logo_url": "https://example.com/adobe-logo.png",
      "next_payment_date": "2025-08-20"
    }
  ],
  "count": 5,
  "generatedAt": "2025-07-29T20:08:29.000Z"
}
```

### 6. Generated Insights
**GET** `/api/analytics/:userId/insights`

Returns AI-generated insights and recommendations based on spending patterns.

**Example Response:**
```json
{
  "insights": [
    {
      "type": "warning",
      "title": "High Monthly Spending",
      "message": "You're spending $89.97 per month on subscriptions.",
      "action": "Consider reviewing and canceling unused subscriptions."
    },
    {
      "type": "reminder",
      "title": "Upcoming Renewals",
      "message": "You have 3 subscription(s) renewing in the next 7 days for $47.97.",
      "action": "Review these subscriptions before they renew."
    },
    {
      "type": "tip",
      "title": "Annual Billing Savings",
      "message": "You have 5 monthly subscriptions that might offer annual discounts.",
      "action": "Check if switching to annual billing can save money."
    }
  ],
  "totalInsights": 3,
  "generatedAt": "2025-07-29T20:08:29.000Z"
}
```

---

## Reports Endpoints

### 1. Data Export
**GET** `/api/reports/:userId/export?format=json&download=true`

Exports subscription data in JSON or CSV format.

**Query Parameters:**
- `format` (optional): Export format - `json` or `csv` (default: json)
- `download` (optional): Set to `true` to trigger file download

**Example Response (JSON):**
```json
{
  "exportInfo": {
    "userId": "uuid-user",
    "exportDate": "2025-07-29T20:08:29.000Z",
    "format": "json",
    "totalSubscriptions": 8,
    "activeSubscriptions": 7,
    "totalMonthlySpending": 89.97
  },
  "subscriptions": [
    {
      "id": "uuid-1",
      "name": "Netflix",
      "cost": 15.99,
      "billing_cycle": "monthly",
      "monthlyCost": 15.99,
      "yearlyCost": 191.88,
      "category": "Entertainment",
      "logo_url": "https://example.com/netflix-logo.png",
      "is_active": true,
      "created_at": "2025-07-01T10:00:00.000Z"
    }
  ],
  "payments": [
    {
      "id": "payment-1",
      "amount": 15.99,
      "payment_date": "2025-07-15",
      "subscriptions": {
        "name": "Netflix",
        "category": "Entertainment"
      }
    }
  ],
  "summary": {
    "categories": {
      "Entertainment": {
        "count": 4,
        "monthlyTotal": 45.98,
        "subscriptions": ["Netflix", "Spotify", "Disney+", "Hulu"]
      }
    },
    "billingCycles": {
      "monthly": 6,
      "yearly": 2
    },
    "monthlySpending": 89.97
  }
}
```

### 2. Period Comparison
**GET** `/api/analytics/:userId/comparison?period=month`

Compares current period spending with previous period.

**Query Parameters:**
- `period`: Comparison period - `month`, `quarter`, or `year` (default: month)

**Example Response:**
```json
{
  "period": "month",
  "currentPeriod": {
    "start": "2025-07-01",
    "end": "2025-07-31",
    "subscriptionCount": 8,
    "monthlySpending": 89.97,
    "newSubscriptions": 2
  },
  "previousPeriod": {
    "start": "2025-06-01",
    "end": "2025-06-30",
    "subscriptionCount": 6,
    "monthlySpending": 67.98,
    "newSubscriptions": 1
  },
  "changes": {
    "subscriptionCount": 2,
    "monthlySpending": 21.99,
    "monthlySpendingPercent": 32.35,
    "trend": "increasing"
  },
  "categoryComparison": [
    {
      "category": "Entertainment",
      "current": 45.98,
      "previous": 29.99,
      "change": 15.99,
      "changePercent": 53.32
    }
  ],
  "insights": [
    {
      "type": "warning",
      "message": "Monthly spending increased by 32.4% compared to the previous month."
    }
  ],
  "generatedAt": "2025-07-29T20:08:29.000Z"
}
```

---

## Chart-Ready Data Formats

All analytics endpoints return data in formats optimized for frontend charting libraries like Recharts:

### Category Pie Chart Data
```javascript
// From /api/analytics/:userId/categories
const pieChartData = response.categories.map(cat => ({
  name: cat.name,
  value: cat.monthly,
  fill: getColorForCategory(cat.name)
}));
```

### Trends Line Chart Data
```javascript
// From /api/analytics/:userId/trends
const lineChartData = response.trends.map(trend => ({
  name: trend.monthName,
  value: trend.total,
  subscriptions: trend.subscriptionCount
}));
```

### Bar Chart Data for Categories
```javascript
// From /api/analytics/:userId/categories
const barChartData = response.categories.map(cat => ({
  category: cat.name,
  monthly: cat.monthly,
  yearly: cat.yearly,
  count: cat.count
}));
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Currently no rate limiting is implemented, but it's recommended for production use.

## CORS

CORS is enabled for the configured frontend URL (`http://localhost:5173` by default).

## Data Types

- All monetary values are returned as numbers with 2 decimal places
- Dates are in ISO 8601 format (`YYYY-MM-DD` or full timestamp)
- Logo URLs are absolute URLs to the stored images
- All responses include a `generatedAt` timestamp
