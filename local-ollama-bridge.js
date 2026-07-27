/*
 * Local Ollama Bridge — يُشغّل مرة واحدة على كمبيوتر العيادة
 * ============================================================
 * يربط نظام إدارة العيادة بخادم Ollama المحلي، ويتيح للواجهة
 * إدارة النماذج (تحميل/حذف) وإجراء محادثة اختبارية بدون أي سطر أوامر.
 *
 * خطوات التشغيل:
 *   1) ثبّت Node.js من https://nodejs.org
 *   2) ثبّت Ollama من https://ollama.com
 *   3) في موجه الأوامر ضمن نفس مجلد هذا الملف نفّذ:
 *        npm install express cors
 *   4) شغّل الجسر:
 *        node bridge.js
 *   5) عد إلى نظام العيادة واضغط "تحديث الحالة".
 *
 * المنفذ الافتراضي: 3001 — يمكنك تغييره من المتغير BRIDGE_PORT بالأسفل.
 */

const express = require('express');
const cors = require('cors');
const { spawn, execFile } = require('child_process');
const http = require('http');

const BRIDGE_PORT = process.env.BRIDGE_PORT || 3001;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const TUNNEL_PORT = process.env.TUNNEL_PORT || 0; // 0 = منفذ عشوائي
const SYSTEM_PROMPT =
  'أنت مساعد طبي متخصص في إدارة عيادات الأسنان في الأردن، تجيب باختصار ووضوح.';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

let tunnelUrl = null; // عنوان النفق العام (HTTPS)

// أدوات مساعدة
// ============

// استدعاء ollama كعملية مع promise
function runOllama(args) {
  return new Promise((resolve, reject) => {
    execFile('ollama', args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || err.message));
        return;
      }
      resolve(stdout);
    });
  });
}

// فحص أن خادم Ollama يستجيب
function checkOllama() {
  return new Promise((resolve) => {
    const req = http.get(`${OLLAMA_HOST}/api/tags`, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(body);
            resolve({ running: true, models: json.models || [] });
            return;
          } catch {
            resolve({ running: true, models: [] });
            return;
          }
        }
        resolve({ running: false, models: [] });
      });
    });
    req.on('error', () => resolve({ running: false, models: [] }));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ running: false, models: [] });
    });
  });
}

// Endpoints
// =========

// 1) حالة الجسر + Ollama
app.get('/api/status', async (_req, res) => {
  const status = await checkOllama();
  res.json({
    bridge: 'online',
    ollama: status.running,
    ollamaHost: OLLAMA_HOST,
    systemPrompt: SYSTEM_PROMPT,
    tunnelUrl,
  });
});

// 2) قائمة النماذج المحملة
app.get('/api/models', async (_req, res) => {
  try {
    const status = await checkOllama();
    if (!status.running) {
      res.status(503).json({ error: 'Ollama غير متصل. تأكد من تشغيل ollama serve.' });
      return;
    }
    const out = await runOllama(['list']);
    // الخرج: NAME ... SIZE ... MODIFIED
    const lines = out.trim().split('\n').slice(1); // تجاهل الترويسة
    const models = lines
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(/\s{2,}/); // أعمدة مفصولة بمسافات متعددة
        return {
          name: (parts[0] || '').trim(),
          size: (parts[1] || '').trim(),
          modified: (parts[2] || '').trim(),
        };
      })
      .filter((m) => m.name);
    res.json({ models });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3) تحميل نموذج جديد (ollama pull) — بثّ التقدم عبر stream
app.post('/api/pull', (req, res) => {
  const { model } = req.body || {};
  if (!model) {
    res.status(400).json({ error: 'اسم النموذج مطلوب' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const child = spawn('ollama', ['pull', model]);

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  let lastLine = '';
  child.stdout.on('data', (chunk) => {
    lastLine += chunk.toString();
    const lines = lastLine.split('\n');
    lastLine = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        send({
          status: parsed.status || 'downloading',
          digest: parsed.digest,
          total: parsed.total,
          completed: parsed.completed,
        });
      } catch {
        send({ status: line.trim() });
      }
    }
  });

  child.stderr.on('data', (chunk) => {
    send({ status: 'log', message: chunk.toString().trim() });
  });

  child.on('close', (code) => {
    if (code === 0) {
      send({ status: 'success', message: `تم تحميل ${model} بنجاح` });
    } else {
      send({ status: 'error', message: `فشل التحميل (كود ${code})` });
    }
    res.end();
  });

  req.on('close', () => {
    child.kill();
  });
});

// 4) حذف نموذج
app.delete('/api/models/:name', async (req, res) => {
  try {
    await runOllama(['rm', req.params.name]);
    res.json({ success: true, message: `تم حذف ${req.params.name}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5) محادثة اختبارية مع النموذج المحلي + System Prompt المتخصص
app.post('/api/chat', async (req, res) => {
  const { message, history = [], model } = req.body || {};
  if (!message) {
    res.status(400).json({ error: 'الرسالة مطلوبة' });
    return;
  }

  try {
    const status = await checkOllama();
    if (!status.running) {
      res.status(503).json({ error: 'Ollama غير متصل' });
      return;
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-8).map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const targetModel = model || 'llama3.2';

    const ollamaRes = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: targetModel, messages, stream: false }),
    });

    if (!ollamaRes.ok) {
      const txt = await ollamaRes.text();
      res.status(502).json({ error: `Ollama: ${ollamaRes.status} ${txt.slice(0, 200)}` });
      return;
    }

    const data = await ollamaRes.json();
    res.json({ reply: data?.message?.content || '', model: targetModel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6) تشغيل/إيقاف خدمة Ollama (ollama serve / إيقاف العملية)
let ollamaServeProc = null;

app.post('/api/service/start', (req, res) => {
  if (ollamaServeProc) {
    res.json({ running: true, message: 'الخدمة تعمل بالفعل' });
    return;
  }
  ollamaServeProc = spawn('ollama', ['serve'], { stdio: 'ignore' });
  ollamaServeProc.on('close', () => {
    ollamaServeProc = null;
  });
  res.json({ running: true, message: 'تم تشغيل خدمة Ollama' });
});

app.post('/api/service/stop', (_req, res) => {
  if (ollamaServeProc) {
    ollamaServeProc.kill();
    ollamaServeProc = null;
    res.json({ running: false, message: 'تم إيقاف خدمة Ollama' });
    return;
  }
  res.json({ running: false, message: 'الخدمة غير مشغّلة' });
});

// نفق عام HTTPS عبر localtunnel — يسمح للموقع المنشور (bolt.host) بالوصول للجسر
async function startTunnel(port) {
  try {
    const localtunnel = await import('localtunnel');
    const tunnel = localtunnel.default({ port, subdomain: process.env.TUNNEL_SUBDOMAIN || undefined });
    tunnel.on('request', (info) => {
      console.log(`  [نفق] طلب جديد: ${info.method} ${info.path}`);
    });
    tunnel.on('error', (err) => {
      console.error('  [نفق] خطأ:', err.message);
    });
    return new Promise((resolve, reject) => {
      tunnel.on('url', (url) => {
        console.log(`  ✅ نفق عام HTTPS نشط على:`);
        console.log(`     ${url}`);
        resolve(url);
      });
      tunnel.on('error', reject);
      setTimeout(() => reject(new Error('انتهت مهلة إنشاء النفق')), 15000);
    });
  } catch (err) {
    console.error('  ⚠️  تعذر إنشاء النفق العام:', err.message);
    console.error('     يمكنك تثبيت localtunnel يدوياً: npm install -g localtunnel');
    return null;
  }
}

app.get('/api/tunnel', (_req, res) => {
  res.json({ url: tunnelUrl, active: !!tunnelUrl });
});

app.listen(BRIDGE_PORT, async () => {
  console.log(`\n  ✅ جسر Ollama المحلي يعمل على:`);
  console.log(`     http://localhost:${BRIDGE_PORT}`);
  console.log(`  ✅ خادم Ollama المستهدف:`);
  console.log(`     ${OLLAMA_HOST}`);

  // إنشاء نفق عام تلقائياً (إلا إذا تم تعطيله)
  if (process.env.NO_TUNNEL !== '1') {
    try {
      tunnelUrl = await startTunnel(BRIDGE_PORT);
      if (tunnelUrl) {
        console.log(`\n  🌐 عنوان النفق العام (انسخه في إعدادات الموقع):`);
        console.log(`     ${tunnelUrl}`);
      }
    } catch (err) {
      console.error('  ⚠️  النفق العام غير متاح:', err.message);
    }
  }

  console.log(`\n  اترك هذه النافذة مفتوحة أثناء استخدام النظام.\n`);
});
