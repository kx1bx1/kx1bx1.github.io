/* global Scratch */
// Name: Dictionaries+
// ID: kxdictionariesplus
// Description: Bring structured data to your Scratch projects. An advancement of the Dictionaries extension.
// By: kx1bx1
// License: MIT

(function (Scratch) {
  'use strict';

  const dictionaries = new Map();

  // Fix: Guard against missing VM in sandboxed environment
  if (Scratch.vm && Scratch.vm.runtime) {
    Scratch.vm.runtime.on('RUNTIME_DISPOSED', () => {
      dictionaries.clear();
    });
  }

  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        obj[i] = sanitize(obj[i]);
      }
      return obj;
    }

    for (const key of Object.keys(obj)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        delete obj[key];
      } else {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  const isPlainObject = (val) => !!val && typeof val === 'object' && !Array.isArray(val);

  const tryParse = (val) => {
    if (typeof val !== 'string') return val;
    const v = val.trim();
    if ((v.startsWith('{') && v.endsWith('}')) || (v.startsWith('[') && v.endsWith(']'))) {
      try {
        return sanitize(JSON.parse(v));
      } catch (_e) {
        return val;
      }
    }
    return val;
  };

  const resolvePath = (root, pathString, autoCreate = false) => {
    if (!pathString || pathString === '') {
      return {
        target: root,
        key: null,
      };
    }

    const placeholder = '\uFFFF';
    const protectedPath = pathString.replace(/\\\./g, placeholder);
    const parts = protectedPath.split('.').map((p) => p.replace(new RegExp(placeholder, 'g'), '.'));

    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];

      if (part === '__proto__' || part === 'constructor' || part === 'prototype') {
        return null;
      }

      if (typeof current !== 'object' || current === null) {
        return null;
      }

      if (current[part] === undefined) {
        if (autoCreate) {
          const nextPart = parts[i + 1];
          current[part] = isNaN(Number(nextPart)) ? {} : [];
        } else {
          return null;
        }
      }

      current = current[part];
    }

    if (typeof current !== 'object' || current === null) return null;

    return {
      target: current,
      key: parts[parts.length - 1],
    };
  };

  const deepMerge = (target, source) => {
    for (const key of Object.keys(source)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;

      if (isPlainObject(source[key]) && isPlainObject(target[key])) {
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  };

  const formatOutput = (value) => {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'object') return JSON.stringify(value);
    return value;
  };

  class DictionariesPlus {
    getInfo() {
      return {
        id: 'kxdictionariesplus',
        name: Scratch.translate('Dictionaries+'),
        color1: '#9639cd',
        color2: '#8432b5',
        color3: '#732b9d',
        blocks: [
          {
            opcode: 'dict_list',
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate('list of dictionaries'),
          },
          {
            opcode: 'dict_stringify',
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate('stringify dictionary [DICT] into JSON'),
            arguments: {
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'foo',
              },
            },
          },
          {
            opcode: 'dict_get',
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate('key [KEY] from dictionary [DICT]'),
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'bar',
              },
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'foo',
              },
            },
          },
          {
            opcode: 'dict_keys',
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate('keys of path [KEY] in dictionary [DICT]'),
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'items',
              },
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'foo',
              },
            },
          },
          {
            opcode: 'dict_length',
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate('length of [KEY] in [DICT]'),
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'items',
              },
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'foo',
              },
            },
          },
          {
            opcode: 'dict_type',
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate('type of [KEY] in [DICT]'),
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'bar',
              },
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'foo',
              },
            },
          },

          '---',

          {
            opcode: 'dict_check_prop',
            blockType: Scratch.BlockType.BOOLEAN,
            text: Scratch.translate('key [KEY] in [DICT] [CHECK]?'),
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'bar',
              },
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'foo',
              },
              CHECK: {
                type: Scratch.ArgumentType.STRING,
                menu: 'check_menu',
              },
            },
          },

          '---',

          {
            opcode: 'dict_manage_key',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('key [KEY] in [DICT]: [ACTION] [VAL]'),
            arguments: {
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'bar',
              },
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'foo',
              },
              ACTION: {
                type: Scratch.ArgumentType.STRING,
                menu: 'key_action_menu',
              },
              VAL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'baz',
              },
            },
          },
          {
            opcode: 'dict_manage',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('dictionary [DICT]: [ACTION] [DATA]'),
            arguments: {
              DICT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'foo',
              },
              ACTION: {
                type: Scratch.ArgumentType.STRING,
                menu: 'dict_action_menu',
              },
              DATA: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '{"bar": "baz"}',
              },
            },
          },
          {
            opcode: 'dict_clone',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('clone dictionary [SRC] as [DEST]'),
            arguments: {
              SRC: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'original',
              },
              DEST: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'copy',
              },
            },
          },
          {
            opcode: 'dict_merge',
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate('merge dictionary [SRC] into [DEST]'),
            arguments: {
              SRC: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'data',
              },
              DEST: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'foo',
              },
            },
          },
        ],
        menus: {
          check_menu: {
            acceptReporters: true,

            items: ['is defined', 'is null', 'is array', 'is dictionary (object)'],
          },
          key_action_menu: {
            acceptReporters: true,
            items: ['set to', 'change by', 'push', 'delete'],
          },
          dict_action_menu: {
            acceptReporters: true,
            items: ['load JSON', 'clear', 'delete'],
          },
        },
      };
    }

    dict_list() {
      return JSON.stringify(Array.from(dictionaries.keys()));
    }

    dict_stringify({ DICT }) {
      if (!dictionaries.has(DICT)) return '{}';
      return JSON.stringify(dictionaries.get(DICT));
    }

    dict_get({ KEY, DICT }) {
      if (!dictionaries.has(DICT)) return 'undefined';
      const root = dictionaries.get(DICT);

      if (KEY === '') return formatOutput(root);

      const loc = resolvePath(root, KEY);
      if (!loc || loc.target === null || loc.target[loc.key] === undefined) {
        return 'undefined';
      }

      return formatOutput(loc.target[loc.key]);
    }

    dict_keys({ KEY, DICT }) {
      if (!dictionaries.has(DICT)) return '[]';
      const root = dictionaries.get(DICT);

      if (!KEY) {
        if (typeof root === 'object' && root !== null) {
          return JSON.stringify(Object.keys(root));
        }
        return '[]';
      }

      const loc = resolvePath(root, KEY);
      if (!loc || loc.target === null || loc.target[loc.key] === undefined) {
        return '[]';
      }

      const val = loc.target[loc.key];
      if (typeof val === 'object' && val !== null) {
        return JSON.stringify(Object.keys(val));
      }
      return '[]';
    }

    dict_length({ KEY, DICT }) {
      if (!dictionaries.has(DICT)) return 0;
      const root = dictionaries.get(DICT);

      if (!KEY) {
        if (Array.isArray(root)) return root.length;
        if (typeof root === 'object' && root !== null) return Object.keys(root).length;
        return 0;
      }

      const loc = resolvePath(root, KEY);
      if (!loc || loc.target === null || loc.target[loc.key] === undefined) return 0;

      const val = loc.target[loc.key];
      if (Array.isArray(val)) return val.length;
      if (typeof val === 'string') return val.length;
      if (typeof val === 'object' && val !== null) return Object.keys(val).length;
      return 0;
    }

    dict_type({ KEY, DICT }) {
      if (!dictionaries.has(DICT)) return 'undefined';
      const root = dictionaries.get(DICT);

      if (KEY === '') {
        if (root === null) return 'null';

        if (Array.isArray(root)) return 'array';
        return typeof root;
      }

      const loc = resolvePath(root, KEY);

      if (!loc || loc.target === null || loc.target[loc.key] === undefined) {
        return 'undefined';
      }

      const val = loc.target[loc.key];
      if (val === null) return 'null';
      if (Array.isArray(val)) return 'array';
      return typeof val;
    }

    dict_check_prop({ KEY, DICT, CHECK }) {
      if (!dictionaries.has(DICT)) return false;
      const root = dictionaries.get(DICT);

      if (KEY === '') {
        if (CHECK === 'is defined') return true;
        if (CHECK === 'is null') return root === null;

        if (CHECK === 'is array') return Array.isArray(root);
        if (CHECK === 'is dictionary (object)') return isPlainObject(root);
        return false;
      }

      const loc = resolvePath(root, KEY);

      if (!loc || loc.target === null) return false;
      const val = loc.target[loc.key];

      if (CHECK === 'is defined') return loc.key in loc.target;
      if (CHECK === 'is null') return val === null;
      if (CHECK === 'is array') return Array.isArray(val);
      if (CHECK === 'is dictionary (object)') return isPlainObject(val);
      return false;
    }

    dict_manage_key({ KEY, DICT, ACTION, VAL }) {
      if (!dictionaries.has(DICT)) dictionaries.set(DICT, {});
      const root = dictionaries.get(DICT);

      if (KEY === '') {
        if (ACTION === 'set to') {
          const newVal = tryParse(VAL);

          if (typeof newVal === 'object' && newVal !== null) {
            dictionaries.set(DICT, newVal);
          }
        } else if (ACTION === 'delete') {
          dictionaries.delete(DICT);
        } else if (ACTION === 'push') {
          if (Array.isArray(root)) {
            root.push(tryParse(VAL));
          }
        }
        return;
      }

      const autoCreate = ACTION !== 'delete';
      const loc = resolvePath(root, KEY, autoCreate);

      if (!loc) return;

      if (ACTION === 'set to') {
        loc.target[loc.key] = tryParse(VAL);
      } else if (ACTION === 'change by') {
        const currentVal = loc.target[loc.key];

        if (typeof currentVal === 'object' && currentVal !== null) return;

        const startVal = Number(currentVal);
        const delta = Number(VAL);

        const safeStart = isNaN(startVal) ? 0 : startVal;
        const safeDelta = isNaN(delta) ? 0 : delta;

        loc.target[loc.key] = safeStart + safeDelta;
      } else if (ACTION === 'push') {
        let targetVal = loc.target[loc.key];

        if (targetVal !== undefined && !Array.isArray(targetVal)) {
          if (typeof targetVal === 'object' && targetVal !== null) return;
          targetVal = [targetVal];
          loc.target[loc.key] = targetVal;
        }

        if (targetVal === undefined) {
          loc.target[loc.key] = [];
          targetVal = loc.target[loc.key];
        }
        targetVal.push(tryParse(VAL));
      } else if (ACTION === 'delete') {
        if (Array.isArray(loc.target)) {
          const index = Math.trunc(Number(loc.key));
          if (!isNaN(index) && index >= 0 && index < loc.target.length) {
            loc.target.splice(index, 1);
          }
        } else {
          delete loc.target[loc.key];
        }
      }
    }

    dict_manage({ DICT, ACTION, DATA }) {
      if (ACTION === 'delete') {
        if (dictionaries.has(DICT)) dictionaries.delete(DICT);
      } else if (ACTION === 'clear') {
        if (dictionaries.has(DICT)) {
          const current = dictionaries.get(DICT);
          dictionaries.set(DICT, Array.isArray(current) ? [] : {});
        }
      } else if (ACTION === 'load JSON') {
        let parsed = null;
        try {
          parsed = sanitize(JSON.parse(DATA));
        } catch (_e) {
          parsed = {
            error: 'Invalid JSON',
          };
        }

        if (typeof parsed !== 'object' || parsed === null) {
          parsed = {
            error: 'Invalid JSON Structure',
          };
        }

        dictionaries.set(DICT, parsed);
      }
    }

    dict_clone({ SRC, DEST }) {
      if (!dictionaries.has(SRC)) return;
      const src = dictionaries.get(SRC);

      try {
        dictionaries.set(DEST, JSON.parse(JSON.stringify(src)));
      } catch (e) {
        console.warn('Dictionaries+: Clone failed', e);
      }
    }

    dict_merge({ SRC, DEST }) {
      if (!dictionaries.has(SRC)) return;
      const srcData = dictionaries.get(SRC);

      if (!dictionaries.has(DEST)) {
        try {
          dictionaries.set(DEST, JSON.parse(JSON.stringify(srcData)));
        } catch (e) {
          console.warn('Dictionaries+: Merge (clone) failed', e);
        }
        return;
      }

      const destData = dictionaries.get(DEST);

      if (isPlainObject(srcData) && isPlainObject(destData)) {
        deepMerge(destData, srcData);
      } else {
        try {
          dictionaries.set(DEST, JSON.parse(JSON.stringify(srcData)));
        } catch (e) {
          console.warn('Dictionaries+: Merge (overwrite) failed', e);
        }
      }
    }
  }

  Scratch.extensions.register(new DictionariesPlus());
})(Scratch);
