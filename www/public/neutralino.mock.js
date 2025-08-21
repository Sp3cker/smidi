/**
 * Neutralino JavaScript client library
 * Minimal version for development
 */

window.Neutralino = {
  // App API
  app: {
    exit: (code = 0) => {
      if (typeof window.close === 'function') {
        window.close();
      } else {
        console.log('Neutralino.app.exit called with code:', code);
      }
    },
    getConfig: () => {
      return Promise.resolve({
        applicationId: "js.neutralino.zero",
        version: "1.0.0",
        defaultMode: "window",
        documentRoot: "/www/dist/",
        url: "/",
        enableServer: true,
        enableNativeAPI: true,
        nativeAllowList: ["app.*"],
        modes: {
          window: {
            title: "smidi=gui",
            width: 800,
            height: 500,
            minWidth: 400,
            minHeight: 200
          }
        }
      });
    },
    broadcast: (event, data) => {
      console.log('Neutralino.app.broadcast:', event, data);
    }
  },

  // Window API
  window: {
    setTitle: (title) => {
      document.title = title;
      console.log('Neutralino.window.setTitle:', title);
    },
    getSize: () => {
      return Promise.resolve({
        width: window.innerWidth,
        height: window.innerHeight
      });
    },
    setSize: (width, height) => {
      console.log('Neutralino.window.setSize:', width, height);
    },
    minimize: () => {
      console.log('Neutralino.window.minimize');
    },
    maximize: () => {
      console.log('Neutralino.window.maximize');
    },
    isMaximized: () => {
      return Promise.resolve(false);
    },
    restore: () => {
      console.log('Neutralino.window.restore');
    },
    setAlwaysOnTop: (alwaysOnTop) => {
      console.log('Neutralino.window.setAlwaysOnTop:', alwaysOnTop);
    },
    getPosition: () => {
      return Promise.resolve({ x: 0, y: 0 });
    },
    setPosition: (x, y) => {
      console.log('Neutralino.window.setPosition:', x, y);
    },
    center: () => {
      console.log('Neutralino.window.center');
    }
  },

  // Filesystem API
  filesystem: {
    readFile: (path) => {
      return fetch(path).then(response => response.text());
    },
    writeFile: (path, data) => {
      console.log('Neutralino.filesystem.writeFile:', path, data);
      return Promise.resolve();
    },
    createDirectory: (path) => {
      console.log('Neutralino.filesystem.createDirectory:', path);
      return Promise.resolve();
    },
    remove: (path) => {
      console.log('Neutralino.filesystem.remove:', path);
      return Promise.resolve();
    },
    readDirectory: (path) => {
      console.log('Neutralino.filesystem.readDirectory:', path);
      return Promise.resolve([]);
    },
    getStats: (path) => {
      console.log('Neutralino.filesystem.getStats:', path);
      return Promise.resolve({});
    }
  },

  // OS API
  os: {
    getEnv: (key) => {
      return Promise.resolve(process.env[key] || '');
    },
    setEnv: (key, value) => {
      console.log('Neutralino.os.setEnv:', key, value);
      return Promise.resolve();
    },
    getPlatform: () => {
      return Promise.resolve(navigator.platform);
    },
    getArch: () => {
      return Promise.resolve('x64');
    },
    showDialog: (title, content, type = 'info') => {
      alert(`${title}\n\n${content}`);
      return Promise.resolve('ok');
    },
    getPath: (name) => {
      const paths = {
        'home': '/home/user',
        'documents': '/home/user/Documents',
        'downloads': '/home/user/Downloads',
        'pictures': '/home/user/Pictures',
        'music': '/home/user/Music',
        'videos': '/home/user/Videos',
        'desktop': '/home/user/Desktop',
        'data': '/home/user/.local/share',
        'temp': '/tmp'
      };
      return Promise.resolve(paths[name] || '/');
    },
    open: (url) => {
      window.open(url, '_blank');
      return Promise.resolve();
    }
  },

  // Events API
  events: {
    on: (event, handler) => {
      console.log('Neutralino.events.on:', event);
      window.addEventListener(event, handler);
    },
    off: (event, handler) => {
      console.log('Neutralino.events.off:', event);
      window.removeEventListener(event, handler);
    },
    broadcast: (event, data) => {
      console.log('Neutralino.events.broadcast:', event, data);
      const customEvent = new CustomEvent(event, { detail: data });
      window.dispatchEvent(customEvent);
    }
  },

  // Debug API
  debug: {
    log: (message, type = 'info') => {
      console.log(`[${type.toUpperCase()}]`, message);
    }
  },

  // Computer API
  computer: {
    getMemoryInfo: () => {
      return Promise.resolve({
        total: 8 * 1024 * 1024 * 1024, // 8 GB
        available: 4 * 1024 * 1024 * 1024, // 4 GB
        used: 4 * 1024 * 1024 * 1024 // 4 GB
      });
    },
    getProcessorInfo: () => {
      return Promise.resolve({
        architecture: 'x64',
        model: navigator.userAgent,
        frequency: 2.5,
        logicalCores: 4
      });
    }
  },

  // Storage API
  storage: {
    getData: (key) => {
      const value = localStorage.getItem(key);
      return Promise.resolve(value ? JSON.parse(value) : null);
    },
    setData: (key, value) => {
      localStorage.setItem(key, JSON.stringify(value));
      return Promise.resolve();
    },
    removeData: (key) => {
      localStorage.removeItem(key);
      return Promise.resolve();
    },
    clearData: () => {
      localStorage.clear();
      return Promise.resolve();
    },
    getKeys: () => {
      const keys = Object.keys(localStorage);
      return Promise.resolve(keys);
    }
  }
};

// Initialize Neutralino
console.log('Neutralino.js loaded in development mode');

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Neutralino initialized for development');
  });
} else {
  console.log('Neutralino initialized for development');
}


