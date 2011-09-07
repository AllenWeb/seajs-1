/*
Copyright 2011, SeaJS v1.0.0
MIT Licensed
build time: Aug 1 17:17
 */

/**
 * @fileoverview A CommonJS module loader, focused on web.
 * @author lifesinger@gmail.com (Frank Wang)
 */

/**
 * Base namespace for the framework.
 */
//seajs Ϊseajs��ܵ�ȫ�ֵ������ռ�
this.seajs = {
	//_seajsΪseajs��һ�����ݣ��ɱ�ʶ�����ǹ��ڲ����õ�
	//���������������ͻ��
	_seajs : this.seajs
};

/**
 * @type {string} The version of the framework. It will be replaced
 * with "major.minor.patch" when building.
 */
seajs.version = '1.0.0';

// Module status:ģ���״̬
//	   downloaded״̬�������ص�������������ǻ�û��ִ��
//  1. downloaded - The script file has been downloaded to the browser. 

//     define()d״̬���Ѿ�ִ��
//  2. define()d - The define() has been executed.

//     memoize()d״̬��ģ���Ѿ�����ӵ�������б� ( ��ʾ��ģ���ѱ����أ����һ���ִ��)
//  3. memoize()d - The module info has been added to memoizedMods.

//     require()d״̬����ʾ��ģ���ǿ��Ա�������ģ����õ�
//  4. require()d -  The module.exports is available.

//����1��define()d ��memoize()d��require()d �����ź����d��ʲô��˼����

/**
 * The private data. Internal use only.
 */
//����
seajs._data = {
	
	/**
	 * The configuration data.
	 */
	//���� seajs
	config : {
		/**
		 * Debug mode. It will be turned off automatically when compressing.
		 * @const
		 */
		debug : '%DEBUG%'
	},
	
	/**
	 * Modules that have been memoize()d.
	 * { uri: { dependencies: [], factory: fn, exports: {} }, ... }
	 */
	//�Ѿ����ص�ģ���б�
	memoizedMods : {},
	
	/**
	 * Store the module information for "real" work in the onload event.
	 */
	//����Ҫ�õ���ģ����б��Ѿ����أ����ǻ�û��ִ��
	pendingMods : [],
	
	/**
	 * Modules that are needed to load before all other modules.
	 */
	//����seajs������ɣ����ȼ��ص�ģ���б�
	preloadMods : []
};

/**
 * The private utils. Internal use only.
 */
//�ṩ��ϵͳ�ڲ����õķ�������
seajs._util = {};

/**
 * The inner namespace for methods. Internal use only.
 */
 
//�ṩ��ϵͳ�ڲ����õĺ�������
seajs._fn = {};

/**
 * @fileoverview The minimal language enhancement.
 */
//������ǿ
(function (util) {
		
		var toString = Object.prototype.toString;
		var AP = Array.prototype;
		
		//�Ǹ��ַ���
		util.isString = function (val) {
			return toString.call(val) === '[object String]';
		};
		//�Ǹ�����
		util.isFunction = function (val) {
			return toString.call(val) === '[object Function]';
		};
		//�Ǹ�����
		util.isArray = Array.isArray || function (val) {
			return toString.call(val) === '[object Array]';
		};
		//����ĳ��ָ���ַ���ֵ���ַ������״γ��ֵ�λ��
		util.indexOf = Array.prototype.indexOf ?
		function (arr, item) {
			return arr.indexOf(item);
		}
		 :
		function (arr, item) {
			for (var i = 0, len = arr.length; i < len; i++) {
				if (arr[i] === item) {
					return i;
				}
			}
			return -1;
		};
		
		//�������е�ÿ��Ԫ�ض�ִ��һ��ָ���ĺ�����callback������ֻ�������еķǿ�Ԫ��ִ��ָ���ĺ�����û�и�ֵ�����Ѿ�ɾ����Ԫ�ؽ������ԡ�
		//forEach ����ı�ԭ�����顣
		var forEach = util.forEach = AP.forEach ?
		function (arr, fn) {
			arr.forEach(fn);
		}
		 :
		function (arr, fn) {
			for (var i = 0, len = arr.length; i < len; i++) {
				fn(arr[i], i, arr);
			}
		};
		
		//�������е�ÿ��Ԫ�ض�ִ��һ��ָ���ĺ�����callback����������ÿ�η��صĽ��ΪԪ�ش���һ�������顣
		//��ֻ�������еķǿ�Ԫ��ִ��ָ���ĺ�����û�и�ֵ�����Ѿ�ɾ����Ԫ�ؽ������ԡ�
		//map ����ı�ԭ�����顣
		util.map = AP.map ?
		function (arr, fn) {
			return arr.map(fn);
		}
		 :
		function (arr, fn) {
			var ret = [];
			forEach(arr, function (item, i, arr) {
					ret.push(fn(item, i, arr));
				});
			return ret;
		};
		//�������е�ÿ��Ԫ�ض�ִ��һ��ָ���ĺ�����callback�������Ҵ���һ���µ����飬������Ԫ�������лص�����ִ��ʱ����ֵΪ true ��ԭ����Ԫ�ء�
		//��ֻ�������еķǿ�Ԫ��ִ��ָ���ĺ�����û�и�ֵ�����Ѿ�ɾ����Ԫ�ؽ������ԣ�ͬʱ���´���������Ҳ���������ЩԪ�ء�
		//filter ����ı�ԭ�����顣
		util.filter = AP.filter ?
		function (arr, fn) {
			return arr.filter(fn);
		}
		 :
		function (arr, fn) {
			var ret = [];
			forEach(arr, function (item, i, arr) {
					if (fn(item, i, arr)) {
						ret.push(item);
					}
				});
			return ret;
		};
		//��ǰʱ��
		util.now = Date.now || function () {
			return new Date().getTime();
		};
		
	})(seajs._util);

/**
 * @fileoverview The error handler.
 */
//������
(function (util, data) {
		
		var config = data.config;
		
		/**
		 * The function to handle inner errors.
		 *
		 * @param {Object} o The error object.
		 */
		util.error = function (o) {
			
			// Throw errors.
			//�׳�����
			if (o.type === 'error') {
				throw 'Error occurs! ' + dump(o);
			}
			// Output debug info.
			//��������֧�� console�����ӡ������firefox��chrome��֧��
			else if (config.debug && typeof console !== 'undefined') {
				console[o.type](dump(o));
			}
		};
		
		//��װ ��ӡ��Ϣ
		function dump(o) {
			var out = ['{'];
			
			for (var p in o) {
				if (typeof o[p] === 'number' || typeof o[p] === 'string') {
					out.push(p + ': ' + o[p]);
					out.push(', ');
				}
			}
			out.pop();
			out.push('}');
			
			return out.join('');
		}
		
	})(seajs._util, seajs._data);

/**
 * @fileoverview The utils for the framework.
 */

//��ܵĹ��߼�

(function (util, data, global) {
		
		var config = data.config;
		
		/**
		 * Extracts the directory portion of a path.
		 * dirname('a/b/c.js') ==> 'a/b/'
		 * dirname('d.js') ==> './'
		 * @see http://jsperf.com/regex-vs-split/2
		 */
		//�����Դ�ļ����ڵ�Ŀ¼
		function dirname(path) {
			var s = path.match(/.*(?=\/.*$)/);
			return (s ? s[0] : '.') + '/';
		}
		
		/**
		 * Canonicalizes a path.
		 * realpath('./a//b/../c') ==> 'a/c'
		 */
		//����ļ�����ʵ·��
		function realpath(path) {
			// 'file:///a//b/c' ==> 'file:///a/b/c'
			// 'http://a//b/c' ==> 'http://a/b/c'
			path = path.replace(/([^:\/])\/+/g, '$1\/');
			
			// 'a/b/c', just return.
			if (path.indexOf('.') === -1) {
				return path;
			}
			
			var old = path.split('/');
			var ret = [],
			part,
			i = 0,
			len = old.length;
			
			for (; i < len; i++) {
				part = old[i];
				if (part === '..') {
					if (ret.length === 0) {
						util.error({
								message : 'invalid path: ' + path,
								type : 'error'
							});
					}
					ret.pop();
				} else if (part !== '.') {
					ret.push(part);
				}
			}
			
			return ret.join('/');
		}
		
		/**
		 * Normalizes an url.
		 */
		//�淶 url��Ҳ��������ĵ�ַ��
		//seajs����js�ļ����Ƽ������ǵ�ַ�в�����׺���ģ�Ȼ�����������ַͳһ�����Ϻ�׺����
		//�ر�˵��������css���ļ�������Ӻ�׺����
		function normalize(url) {
			url = realpath(url);
			
			// Adds the default '.js' extension except that the url ends with #.
			if (/#$/.test(url)) {
				url = url.slice(0, -1);
			} else if (url.indexOf('?') === -1 && !/\.(?:css|js)$/.test(url)) {
				url += '.js';
			}
			
			return url;
		}
		
		/**
		 * Parses alias in the module id. Only parse the prefix and suffix.
		 */
		//���� ����
		function parseAlias(id) {
			var alias = config['alias'];
			
			var parts = id.split('/');
			var last = parts.length - 1;
			
			parse(parts, 0);
			
			//Ҫ��û��б��
			if (last){
				parse(parts, last);
			}
				
			
			function parse(parts, i) {
				// i = 0 ȡ��һ��б��ǰ���ַ���
				var part = parts[i];
				if (alias && alias.hasOwnProperty(part)) {
					parts[i] = alias[part];
				}
			}
			
			return parts.join('/');
		}
		
		/**
		 * Maps the module id.
		 */
		//���� ӳ��
		//�������ʱ��� ��[ [ /^(.*\.(?:css|js))(.*)$/i, '$1?20110801' ] 	  ]
		function parseMap(url) {
			// config.map: [[match, replace], ...]
			
			util.forEach(config['map'], function (rule) {
					if (rule && rule.length === 2) {
						url = url.replace(rule[0], rule[1]);
					}
				});
			
			return url;
		}
		
		/**
		 * Gets the host portion from url.
		 */
		//��ȡ����
		//http://www.domain.com/test/demo/demo.xxx -->http://www.domain.com
		function getHost(url) {
			return url.replace(/^(\w+:\/\/[^/]*)\/?.*$/,'$1');
		}
		
		/*
		* eg:
		* url : http://www.w3school.com.cn/js/jsref_obj_array.asp
		* loc.protocol : http
		* loc.host : www.w3school.com.cn
		* loc.pathname : /js/jsref_obj_array.asp
		*/
		
		var loc = global['location'];
		var pageUrl = loc.protocol + '//' + loc.host + loc.pathname;
		
		// local file in IE: C:\path\to\xx.js
		if (pageUrl.indexOf('\\') !== -1) {
			pageUrl = pageUrl.replace(/\\/g, '/');
		}
		
		//��¼��ЩID�Ѿ���ת��Ϊuri
		var id2UriCache = {};
		
		/**
		 * Converts id to uri.
		 * @param {string} id The module id. ģ���ID
		 * @param {string=} refUrl The referenced uri for relative id. 
		 *                  ���ID���õ�url���¾���˵��Ҫ����Եĵ�ַ��ʱ�򣬵ĸ���������ĵ�ַ�����refUrl���ǲ�����ĵ�ַ
		 * @param {boolean=} noAlias When set to true, don't pass alias. ��û�б�����Ҫ���о͵ô���
		 */
		//��idת��Ϊuri
		
		function id2Uri(id, refUrl, noAlias) {
			// only run once.
			//ͬһ��ID��ת��һ��
			if (id2UriCache[id]) {
				return id;
			}
			//�������
			if (!noAlias && config['alias']) {
				id = parseAlias(id);
			}
			refUrl = refUrl || pageUrl;
			
			var ret;
			
			//���·ֺü������������
			
			// absolute id
			if (id.indexOf('://') !== -1) {
				ret = id;
			}
			// relative id
			else if (id.indexOf('./') === 0 || id.indexOf('../') === 0) {
				// Converts './a' to 'a', to avoid unnecessary loop in realpath.
				id = id.replace(/^\.\//, '');
				ret = dirname(refUrl) + id;
			}
			// root id
			else if (id.indexOf('/') === 0) {
				ret = getHost(refUrl) + id;
			}
			// top-level id
			else {
				ret = getConfigBase() + '/' + id;
			}
			
			ret = normalize(ret);
			if (config['map']) {
				ret = parseMap(ret);
			}
			
			id2UriCache[ret] = true;
			return ret;
		}
		
		//���base·��
		function getConfigBase() {
			if (!config.base) {
				util.error({
						message : 'the config.base is empty',
						from : 'id2Uri',
						type : 'error'
					});
			}
			return config.base;
		}
		
		/**
		 * Converts ids to uris.
		 * @param {Array.<string>} ids The module ids.
		 * @param {string=} refUri The referenced uri for relative id.
		 */
		//��һ��ID ת��Ϊһ�� uri
		function ids2Uris(ids, refUri) {
			return util.map(ids, function (id) {
					return id2Uri(id, refUri);
				});
		}
		
		//��ģ�����Ϣ �洢�������б� memoizedMods
		var memoizedMods = data.memoizedMods;
		
		/**
		 * Caches mod info to memoizedMods.
		 */
		//����ģ����Ϣ
		function memoize(id, url, mod) {
			var uri;
			
			// define('id', [], fn)
			if (id) {
				uri = id2Uri(id, url, true);
			} else {
				uri = url;
			}
			//ģ��������б�
			mod.dependencies = ids2Uris(mod.dependencies, uri);
			//�����ģ�飬�Ժ�Ͳ������ڼ��ظ�ģ����
			memoizedMods[uri] = mod;
			
			// guest module in package
			// ��������ʲô��û�п����ף�
			if (id && url !== uri) {
				var host = memoizedMods[url];
				if (host) {
					augmentPackageHostDeps(host.dependencies, mod.dependencies);
				}
			}
		}
		
		/**
		 * Set mod.ready to true when all the requires of the module is loaded.
		 */
		//���� �����б��� uris״̬���Ѿ��������
		function setReadyState(uris) {
			util.forEach(uris, function (uri) {
					if (memoizedMods[uri]) {
						memoizedMods[uri].ready = true;
					}
				});
		}
		
		/**
		 * Removes the "ready = true" uris from input.
		 */
		//��û����б��� ��û�м��سɹ��� uris
		function getUnReadyUris(uris) {
			return util.filter(uris, function (uri) {
					var mod = memoizedMods[uri];
					return !mod || !mod.ready;
				});
		}
		
		/**
		 * if a -> [b -> [c -> [a, e], d]]
		 * call removeMemoizedCyclicUris(c, [a, e])
		 * return [e]
		 */
		//������˼���Ƴ�uri�������б��л��ڵȴ���uris ���е������ˣ������ڴ���ѭ��������
		//����2. c -> [a, e], d] �� c -> a,e,d��������������ʲô���𰡣�
		//����3.�����ѭ��������������ô������
		//����4.�����ע�͵����ӵķ���ֵΪʲô�� e?����Ϊ����ֵӦ���� b,c,e,d
		function removeCyclicWaitingUris(uri, deps) {
			return util.filter(deps, function (dep) {
					return !isCyclicWaiting(memoizedMods[dep], uri);
				});
		}
		
		function isCyclicWaiting(mod, uri) {
			//ģ��δ��������Ѿ����سɹ�
			if (!mod || mod.ready) {
				return false;
			}
			
			var deps = mod.dependencies || [];
			if (deps.length) {
				//�����б��а��� uri
				if (util.indexOf(deps, uri) !== -1) {
					return true;
				//��֮
				} else {
					for (var i = 0; i < deps.length; i++) {
						if (isCyclicWaiting(memoizedMods[deps[i]], uri)) {
							return true;
						}
					}
					return false;
				}
			}
			return false;
		}
		
		/**
		 * For example:
		 *  sbuild host.js --combo
		 *   define('./host', ['./guest'], ...)
		 *   define('./guest', ['jquery'], ...)
		 * The jquery is not combined to host.js, so we should add jquery
		 * to host.dependencies
		 */
		function augmentPackageHostDeps(hostDeps, guestDeps) {
			util.forEach(guestDeps, function (guestDep) {
					if (util.indexOf(hostDeps, guestDep) === -1) {
						hostDeps.push(guestDep);
					}
				});
		}
		
		util.dirname = dirname;
		
		util.id2Uri = id2Uri;
		util.ids2Uris = ids2Uris;
		
		util.memoize = memoize;
		util.setReadyState = setReadyState;
		util.getUnReadyUris = getUnReadyUris;
		util.removeCyclicWaitingUris = removeCyclicWaitingUris;
		
		if (data.config.debug) {
			util.realpath = realpath;
			util.normalize = normalize;
			util.parseAlias = parseAlias;
			util.getHost = getHost;
		}
		
	})(seajs._util, seajs._data, this);

/**
 * @fileoverview DOM utils for fetching script etc.
 */
//DOM �����߼�
(function (util, data) {
		
		var head = document.getElementsByTagName('head')[0];
		var isWebKit = navigator.userAgent.indexOf('AppleWebKit') !== -1;
		
		//�����Դ
		util.getAsset = function (url, callback, charset) {
			var isCSS = /\.css(?:\?|$)/i.test(url);
			var node = document.createElement(isCSS ? 'link' : 'script');
			if (charset)
				node.setAttribute('charset', charset);
			
			assetOnload(node, function () {
					if (callback)
						callback.call(node);
					if (isCSS)
						return;
					
					// Don't remove inserted node when debug is on.
					if (!data.config.debug) {
						try {
							// Reduces memory leak.
							if (node.clearAttributes) {
								node.clearAttributes();
							} else {
								for (var p in node)
									delete node[p];
							}
						} catch (x) {}
						head.removeChild(node);
					}
				});
			
			if (isCSS) {
				node.rel = 'stylesheet';
				node.href = url;
				head.appendChild(node); // keep order
			} else {
				node.async = true;
				node.src = url;
				head.insertBefore(node, head.firstChild);
			}
			
			return node;
		};
		
		// ������Դ�ļ�
		function assetOnload(node, callback) {
			if (node.nodeName === 'SCRIPT') {
				scriptOnload(node, cb);
			} else {
				styleOnload(node, cb);
			}
			
			var timer = setTimeout(function () {
						cb();
						util.error({
								message : 'time is out',
								from : 'getAsset',
								type : 'warn'
							});
					}, data.config.timeout);
			
			function cb() {
				cb.isCalled = true;
				callback();
				clearTimeout(timer);
			}
		}
		
		
		//˵�����ڼ���js��css��ʱ�򣬸���������ж��Ƿ���سɹ���һ������������Ĵ��뿴���е㸴�ӣ�����Ĵ󲿷ִ������ڴ������������
		
		//����js�ļ�
		function scriptOnload(node, callback) {
			if (node.addEventListener) {
				node.addEventListener('load', callback, false);
				node.addEventListener('error', callback, false);
				// NOTICE: Nothing will happen in Opera when the file status is 404. In
				// this case, the callback will be called when time is out.
			} else { // for IE6-8
				node.attachEvent('onreadystatechange', function () {
						var rs = node.readyState;
						if (rs === 'loaded' || rs === 'complete') {
							callback();
						}
					});
			}
		}
		// ����css�ļ�
		function styleOnload(node, callback) {
			// for IE6-9 and Opera
			if (node.attachEvent) {
				node.attachEvent('onload', callback);
				// NOTICE:
				// 1. "onload" will be fired in IE6-9 when the file is 404, but in
				// this situation, Opera does nothing, so fallback to timeout.
				// 2. "onerror" doesn't fire in any browsers!
			}
			// polling for Firefox, Chrome, Safari
			else {
				setTimeout(function () {
						poll(node, callback);
					}, 0); // for cache
			}
		}
		
		function poll(node, callback) {
			if (callback.isCalled) {
				return;
			}
			
			var isLoaded = false;
			
			if (isWebKit) {
				if (node['sheet']) {
					isLoaded = true;
				}
			}
			// for Firefox
			else if (node['sheet']) {
				try {
					if (node['sheet'].cssRules) {
						isLoaded = true;
					}
				} catch (ex) {
					if (ex.name === 'NS_ERROR_DOM_SECURITY_ERR') {
						isLoaded = true;
					}
				}
			}
			
			if (isLoaded) {
				// give time to render.
				setTimeout(function () {
						callback();
					}, 1);
			} else {
				setTimeout(function () {
						poll(node, callback);
					}, 1);
			}
		}
		
		util.assetOnload = assetOnload;
		
		var interactiveScript = null;
		
		//������˼�ǻ��һ���ɽ����Ľű�,����������������������ʲô��
		//����5������˵����������ʲô?
		util.getInteractiveScript = function () {
			if (interactiveScript && interactiveScript.readyState === 'interactive') {
				return interactiveScript;
			}
			
			var scripts = head.getElementsByTagName('script');
			
			for (var i = 0; i < scripts.length; i++) {
				var script = scripts[i];
				if (script.readyState === 'interactive') {
					interactiveScript = script;
					return script;
				}
			}
			
			return null;
		};
		
		//��ýű��ļ��ľ��Ե�ַ
		util.getScriptAbsoluteSrc = function (node) {
			return node.hasAttribute ? // non-IE6/7
			node.src :
			// see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
			node.getAttribute('src', 4);
		};
		
		//ʱ���
		var noCacheTimeStamp = 'seajs-ts=' + util.now();
		
		//���ʱ���
		util.addNoCacheTimeStamp = function (url) {
			return url + (url.indexOf('?') === -1 ? '?' : '&') + noCacheTimeStamp;
		};
		// �Ƴ�ʱ���
		util.removeNoCacheTimeStamp = function (url) {
			var ret = url;
			if (url.indexOf(noCacheTimeStamp) !== -1) {
				ret = url.replace(noCacheTimeStamp, '').slice(0, -1);
			}
			return ret;
		};
		
	})(seajs._util, seajs._data);

/**
 * references:
 *  - http://lifesinger.org/lab/2011/load-js-css/
 *  - ./test/issues/load-css/test.html
 */

/**
 * @fileoverview Loads a module and gets it ready to be require()d.
 */
//����ģ��
(function (util, data, fn, global) {
		
		/**
		 * Modules that are being downloaded.
		 * { uri: scriptNode, ... }
		 */
		 //Ҫ��̬ץȡ��ģ����б�
		var fetchingMods = {};
		//ģ��Ļ����б�
		var memoizedMods = data.memoizedMods;
		
		/**
		 * Loads modules to the environment.
		 * @param {Array.<string>} ids An array composed of module id.	һ��ID
		 * @param {function(*)=} callback The callback function. 
		 * @param {string=} refUrl The referenced uri for relative id. 	�ο�·��
		 */
		fn.load = function (ids, callback, refUrl) {
			if (util.isString(ids)) {
				ids = [ids];
			}
			var uris = util.ids2Uris(ids, refUrl);
			
			provide(uris, function () {
					var require = fn.createRequire({
								uri : refUrl
							});
					
					var args = util.map(uris, function (uri) {
								return require(uri);
							});
					
					if (callback) {
						callback.apply(global, args);
					}
				});
		};
		
		/**
		 * Provides modules to the environment.�ṩģ��Ļ���
		 * @param {Array.<string>} uris An array composed of module uri.
		 * @param {function()=} callback The callback function.
		 */
		function provide(uris, callback) {
			//��û����б��� ��û�м��سɹ��� uris
			var unReadyUris = util.getUnReadyUris(uris);
			
			if (unReadyUris.length === 0) {
				return onProvide();
			}
			
			for (var i = 0, n = unReadyUris.length, remain = n; i < n; i++) {
			
				(function (uri) {
						//�����б������е�����ػ����б������ģ��
						if (memoizedMods[uri]) {
							onLoad();
						} 
						//��֮����ץȡ
						else {
							fetch(uri, onLoad);
						}
						
						function onLoad() {
							var deps = (memoizedMods[uri] || 0).dependencies || [];
							var m = deps.length;
							
							if (m) {
								// if a -> [b -> [c -> [a, e], d]]
								// when use(['a', 'b'])
								// should remove a from c.deps
								//����6��Ϊʲô should remove a from c.deps?
								deps = util.removeCyclicWaitingUris(uri, deps);
								m = deps.length;
							}
							
							if (m) {
								remain += m;
								provide(deps, function () {
										remain -= m;
										if (remain === 0)
											onProvide();
									});
							}
							if (--remain === 0){
								onProvide();
							}
								
						}
						
					})(unReadyUris[i]);
					
			}
			//���е�uri�����سɹ�
			function onProvide() {
				util.setReadyState(unReadyUris);
				callback();
			}
		}
		
		/**
		 * Fetches a module file.
		 * @param {string} uri The module uri.
		 * @param {function()} callback The callback function.
		 */
		function fetch(uri, callback) {
			
			if (fetchingMods[uri]) {
				util.assetOnload(fetchingMods[uri], cb);
			} else {
				// See fn-define.js: "uri = data.pendingModIE" 
				// ����7��pendingModIE ��������ʲô��
				data.pendingModIE = uri;
				
				fetchingMods[uri] = util.getAsset(
						getUrl(uri),
						cb,
						data.config.charset);
				
				data.pendingModIE = null;
			}
			
			function cb() {
				
				if (data.pendingMods) {
					//�� pendingMods ��ӵ������б�
					util.forEach(data.pendingMods, function (pendingMod) {
							util.memoize(pendingMod.id, uri, pendingMod);
						});
					
					data.pendingMods = [];
				}
				
				if (fetchingMods[uri]) {
					delete fetchingMods[uri];
				}
				
				if (!memoizedMods[uri]) {
					util.error({
							message : 'can not memoized',
							from : 'load',
							uri : uri,
							type : 'warn'
						});
				}
				
				if (callback) {
					callback();
				}
			}
		}
		
		function getUrl(uri) {
			var url = uri;
			
			// When debug is 2, a unique timestamp will be added to each URL.
			// This can be useful during testing to prevent the browser from
			// using a cached version of the file.
			if (data.config.debug == 2) {
				url = util.addNoCacheTimeStamp(url);
			}
			
			return url;
		}
		
	})(seajs._util, seajs._data, seajs._fn, this);

/**
 * @fileoverview Module Constructor.
 */
// ģ��Ĺ��췽��
(function (fn) {
		
		/**
		 * Module constructor.
		 * @constructor
		 * @param {string=} id The module id.
		 * @param {Array.<string>|string=} deps The module dependencies.
		 * @param {function()|Object} factory The module factory function.
		 */
		fn.Module = function (id, deps, factory) {
			
			this.id = id;
			this.dependencies = deps || [];
			this.factory = factory;
			
		};
		
	})(seajs._fn);

/**
 * @fileoverview Module authoring format.
 */
//����һ��ģ��
(function (util, data, fn) {
		
		/**
		 * Defines a module.
		 * @param {string=} id The module id. ��ʶ��
		 * @param {Array.<string>|string=} deps The module dependencies. ����ģ���б�
		 * @param {function()|Object} factory The module factory function. ������
		 */
		//����һ��ģ��
		fn.define = function (id, deps, factory) {
			
			// define(factory)
			if (arguments.length === 1) {
				factory = id;
				if (util.isFunction(factory)) {
					//��ȡ�����б�
					deps = parseDependencies(factory.toString());
				}
				id = '';
			}
			// define([], factory)
			else if (util.isArray(id)) {
				factory = deps;
				deps = id;
				id = '';
			}
			//newһ���µ�ģ��
			var mod = new fn.Module(id, deps, factory);
			var url;
			
			//����Ӧ����IE��һ��Hack��
			if (document.attachEvent && !window.opera) {
				// For IE6-9 browsers, the script onload event may not fire right
				// after the the script is evaluated. Kris Zyp found that it
				// could query the script nodes and the one that is in "interactive"
				// mode indicates the current script. Ref: http://goo.gl/JHfFW
				var script = util.getInteractiveScript();
				if (script) {
					url = util.getScriptAbsoluteSrc(script);
					// remove no cache timestamp
					if (data.config.debug == 2) {
						url = util.removeNoCacheTimeStamp(url);
					}
				}
				
				// In IE6-9, if the script is in the cache, the "interactive" mode
				// sometimes does not work. The script code actually executes *during*
				// the DOM insertion of the script tag, so we can keep track of which
				// script is being requested in case define() is called during the DOM
				// insertion.
				else {
					url = data.pendingModIE;
				}
				
				// NOTE: If the id-deriving methods above is failed, then falls back
				// to use onload event to get the module uri.
			}
			
			if (url) {
				util.memoize(id, url, mod);
			} else {
				// Saves information for "real" work in the onload event.
				data.pendingMods.push(mod);
			}
			
		};
		//����code ��code��ȡ��require(string);
		function parseDependencies(code) {
			// Parse these `requires`:
			//   var a = require('a');
			//   someMethod(require('b'));
			//   require('c');
			//   ...
			// Doesn't parse:
			//   someInstance.require(...);
			var pattern = /[^.]\brequire\s*\(\s*['"]?([^'")]*)/g;
			var ret = [],
			match;
			
			code = removeComments(code);
			while ((match = pattern.exec(code))) {
				if (match[1]) {
					ret.push(match[1]);
				}
			}
			
			return ret;
		}
		
		// http://lifesinger.org/lab/2011/remove-comments-safely/
		//ɾ��ע��
		function removeComments(code) {
			return code
			.replace(/(?:^|\n|\r)\s*\/\*[\s\S]*?\*\/\s*(?:\r|\n|$)/g, '\n')
			.replace(/(?:^|\n|\r)\s*\/\/.*(?:\r|\n|$)/g, '\n');
		}
		
	})(seajs._util, seajs._data, seajs._fn);

/**
 * @fileoverview The factory for "require".
 */
//'require' ����
(function (util, data, fn) {
		
		/**
		 * The factory of "require" function.
		 * @param {Object} sandbox The data related to "require" instance.
		 */
		function createRequire(sandbox) {
			// sandbox: {
			//   uri: '',
			//   deps: [],
			//   parent: sandbox
			// }
			
			function require(id) {
				//�����Դ��ʶ��
				var uri = util.id2Uri(id, sandbox.uri);
				//�����ѻ�õ���Դ��ʶ��ȥ�����б������ȡģ��
				var mod = data.memoizedMods[uri];
				
				// Just return null when: Ϊ�յļ��������
				//  1. the module file is 404. ��ģ���ļ��Ҳ���
				//  2. the module file is not written with valid module format.��ģ���ļ�����д�ĸ�ʽ������seajsҪ��ĸ�ʽ
				//  3. other error cases. ������ԭ��
				if (!mod) {
					return null;
				}
				
				// Checks cyclic dependencies.
				//���ѭ������
				if (isCyclic(sandbox, uri)) {
					util.error({
							message : 'found cyclic dependencies',
							from : 'require',
							uri : uri,
							type : 'warn'
						});
					
					return mod.exports;
				}
				
				// Initializes module exports.
				//��ʼ��ģ��Ķ���ӿ�
				if (!mod.exports) {
					initExports(mod, {
							uri : uri,
							deps : mod.dependencies,
							parent : sandbox
						});
				}
				
				return mod.exports;
			}
			//�첽����
			require.async = function (ids, callback) {
				fn.load(ids, callback, sandbox.uri);
			};
			
			return require;
		}
		
		function initExports(mod, sandbox) {
			var ret;
			var factory = mod.factory;
			
			// Attaches members to module instance.
			//mod.dependencies
			mod.id = sandbox.uri;
			mod.exports = {};
			delete mod.factory; // free
			delete mod.ready; // free
			
			if (util.isFunction(factory)) {
				checkPotentialErrors(factory, mod.uri);
				ret = factory(createRequire(sandbox), mod.exports, mod);
				if (ret !== undefined) {
					mod.exports = ret;
				}
			} else if (factory !== undefined) {
				mod.exports = factory;
			}
		}
		
		//���ѭ������
		function isCyclic(sandbox, uri) {
			if (sandbox.uri === uri) {
				return true;
			}
			if (sandbox.parent) {
				return isCyclic(sandbox.parent, uri);
			}
			return false;
		}
		//�������˼�Ǽ��Ǳ�ڵĴ��� Ҳ��˵����ȷ��ʹ�� exoprts
		function checkPotentialErrors(factory, uri) {
			if (factory.toString().search(/\sexports\s*=\s*[^=]/) !== -1) {
				util.error({
						message : 'found invalid setter: exports = {...}',
						from : 'require',
						uri : uri,
						type : 'error'
					});
			}
		}
		
		fn.createRequire = createRequire;
		
	})(seajs._util, seajs._data, seajs._fn);

/**
 * @fileoverview The configuration.
 */
//ȫ������
(function (util, data, fn, global) {
		
		var config = data.config;
		
		//start================================== ���� ȫ�ֵ�base·��
		
		// Async inserted script.
		var loaderScript = document.getElementById('seajsnode');
		
		// Static script.
		if (!loaderScript) {
			var scripts = document.getElementsByTagName('script');
			//��ȡ���һ��script ��ǩ
			loaderScript = scripts[scripts.length - 1];
		}
		
		var loaderSrc = util.getScriptAbsoluteSrc(loaderScript),
		loaderDir;
		if (loaderSrc) {
			var base = loaderDir = util.dirname(loaderSrc);
			// When src is "http://test.com/libs/seajs/1.0.0/sea.js", redirect base
			// to "http://test.com/libs/"
			var match = base.match(/^(.+\/)seajs\/[\d\.]+\/$/);
			if (match) {
				base = match[1];
			}
			config.base = base;
		}
		// When script is inline code, src is empty.
		
		//end====================================
		
		//data-main ��ֵ��Ӧ��ģ�飬��seajs������ɺ��һ��������
		//˵���� Ҫ��config.preloadMods��ֵΪ�գ���֮���ȼ��� config.preloadMods ���б��ֵ��Ȼ���ڼ���data-main��Ӧ���Ǹ�ģ�� 
		config.main = loaderScript.getAttribute('data-main') || '';
		
		// The max time to load a script file.
		//���س�ʱʱ��
		config.timeout = 20000;
		
		// seajs-debug
		if (loaderDir &&
			(global.location.search.indexOf('seajs-debug') !== -1 ||
				document.cookie.indexOf('seajs=1') !== -1)) {
			config.debug = true;
			//Ҫ����debugģʽ����Ҫ��ǰ���ص�ģ��
			data.preloadMods.push(loaderDir + 'plugin-map');
		}
		
		/**
		 * The function to configure the framework.
		 * config({
		 *   'base': 'path/to/base',
		 *   'alias': {
		 *     'app': 'biz/xx',
		 *     'jquery': 'jquery-1.5.2',
		 *     'cart': 'cart?t=20110419'
		 *   },
		 *   'map': [
		 *     ['test.cdn.cn', 'localhost']
		 *   ],
		 *   charset: 'utf-8',
		 *   timeout: 20000, // 20s
		 *   debug: false,
		 *   main: './init'
		 * });
		 *
		 * @param {Object} o The config object.
		 */
		fn.config = function (o) {
			for (var k in o) {
				var sub = config[k];
				if (typeof sub === 'object') {
					mix(sub, o[k]);
				} else {
					config[k] = o[k];
				}
			}
			
			// Make sure config.base is absolute path.
			var base = config.base;
			if (base.indexOf('://') === -1) {
				config.base = util.id2Uri(base + '#');
			}
			
			return this;
		};
		
		function mix(r, s) {
			for (var k in s) {
				r[k] = s[k];
			}
		}
		
	})(seajs._util, seajs._data, seajs._fn, this);

/**
 * @fileoverview The bootstrap and entrances.
 */
//���������
(function (host, data, fn) {
		
		var config = data.config;
		var preloadMods = data.preloadMods;
		
		/**
		 * Loads modules to the environment.
		 * @param {Array.<string>} ids An array composed of module id.
		 * @param {function(*)=} callback The callback function.
		 */
		fn.use = function (ids, callback) {
			var mod = preloadMods[0];
			if (mod) {
				// Loads preloadMods one by one, because the preloadMods
				// may be dynamically changed.
				fn.load(mod, function () {
						if (preloadMods[0] === mod) {
							//ɾ��
							preloadMods.shift();
						}
						fn.use(ids, callback);
					});
			} else {
				fn.load(ids, callback);
			}
		};
		
		// main
		var mainModuleId = config.main;
		if (mainModuleId) {
			fn.use([mainModuleId]);
		}
		
		// Parses the pre-call of seajs.config/seajs.use/define.
		// Ref: test/bootstrap/async-3.html
		//����8����һ��������ʲô����������
		(function (args) {
			if (args) {
				var hash = {
					0 : 'config',
					1 : 'use',
					2 : 'define'
				};
				for (var i = 0; i < args.length; i += 2) {
					fn[hash[args[i]]].apply(host, args[i + 1]);
				}
				delete host._seajs;
			}
		})((host._seajs || 0)['args']);
		
	})(seajs, seajs._data, seajs._fn);

/**
 * @fileoverview The public api of seajs.
 */
//�����API
(function (host, data, fn, global) {
		
		// SeaJS Loader API:
		host.config = fn.config;
		host.use = fn.use;
		
		// Module Authoring API:
		var previousDefine = global.define;
		global.define = fn.define;
		
		// For custom loader name.
		host.noConflict = function (all) {
			global.seajs = host._seajs;
			if (all) {
				global.define = previousDefine;
				host.define = fn.define;
			}
			return host;
		};
		
		// Keeps clean!
		if (!data.config.debug) {
			delete host._util;
			delete host._data;
			delete host._fn;
			delete host._seajs;
		}
		
	})(seajs, seajs._data, seajs._fn, this);
 