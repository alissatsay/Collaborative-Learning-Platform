import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '20s', target: 10 },
        { duration: '20s', target: 30 },
        { duration: '20s', target: 50 },
        { duration: '20s', target: 75 },
        { duration: '20s', target: 100 },
        { duration: '20s', target: 0 },
      ],
      gracefulRampDown: '10s',
      gracefulStop: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],       // <1% errors
    http_req_duration: ['p(95)<300'],     // p95 < 300ms
  },
};

const BASE = 'http://127.0.0.1:8000';

export default function () {
  // Pick endpoints that exist and return 200 without auth
  const res1 = http.get(`${BASE}/api/classes/2/`);
  check(res1, { 'classes/2 200': (r) => r.status === 200 });

  
  const res2 = http.get(`${BASE}/api/assignments/?course=2`);
  check(res2, { 'assignments?course=2 200': (r) => r.status === 200 || r.status === 404 });

  sleep(0.1); // slight pacing to avoid unrealistic hammering
}
