/*
 * fis
 * http://fis.baidu.com/
 */

'use strict';

var postcss = require('postcss');

module.exports = function(content, file, conf, callback) {
  if (!callback) {
    throw new Error('Async plugin is not supported in `fis3`, please use `fis3-async`。');
  }
  
  var plugins = [
    require('postcss-import')({
      path: [file.dirname]
    }),
    require('postcss-mixins'),
    require('postcss-cssnext')
  ];

  if (conf.report) {
    plugins.push(require('doiuse')(conf.doiuseOption), require('postcss-reporter'));
  }

  postcss(plugins)
    .process(content, conf.sourceMap ? {
      map: {
        inline: false
      },
      from: file.subpath,
      to: file.release
    } : false)
    .then(function(ret) {
      content = ret.css;

      if (ret.map) {
        var mapping = fis.file.wrap(file.dirname + '/' + file.filename + file.rExt + '.map');
    
        // 修改 source 文件名。
        // var sourceMapObj = JSON.parse(ret.map.toString('utf8'));
        // sourceMapObj.sources[0] = file.subpath;
        // mapping.setContent(JSON.stringify(sourceMapObj, null, 4));
        mapping.setContent(ret.map);
        
        var url = mapping.getUrl(fis.compile.settings.hash, fis.compile.settings.domain);
    
        content = ret.css.replace(/\n?\s*\/\*#\ssourceMappingURL=.*?(?:\n|$)/g, '');
        content += '\n/*# sourceMappingURL=' +  url + '*/\n';
    
        file.extras = file.extras || {};
        file.extras.derived = file.extras.derived || [];
        file.extras.derived.push(mapping);
      }
      callback(null, content)
    });
}


module.exports.defaultOptions = {
  doiuseOption: {
    browsers: [
      'ie >= 9',
      '> 1%'
    ],
    ignore: ['rem']
  },
  sourceMap: false,
  report: false
};