Package Decription:
==================

Helpers:
------------------

1. 'js2doxy': contains the source code of preprocess tool to transform jsdoc-formated comments into pseudo java files, in order to be directly used by doxygen tool;
2. 'templates': contains the doxygen templates and config files;
3. 'build.xml': ant file to generate js2doxy tool jar;

Useful:
------------------

1. 'mdfiles':
    + **Content**: contains markdown files to include in document with a 'resources' file to include necessary resources in the markdown files(e.g. pictures);
    + **Tips**: You can add additional markdown pages to be include in the document and put the resources into 'resource' package.
2. 'gendoc.sh':
    + **Content**: the script to generate the document and output a package named 'docout'.
    + **Usage**:　example usage: ./gendoc.sh /home/bean/workspace/webrtc-javascript-sdk/docs/mdfiles/sipcomment.js
    +**Tips**: by default, 6 files in this repo is included: 'peer.js', 'conference.js', 'events.js', 'stream.js', 'N.API.js' and 'ui.js'. If you want to include other javascript files, just add the its path as argument.

Note: before running this script, you should install doxygen first.
See instruction at https://www.stack.nl/~dimitri/doxygen/manual/install.html
For Ubuntu, you can directly run the following commands to install doxygen under version 1.8.6.
    sudo apt-get update
    sudo apt-get install doxygen
3. 'docformat.md': the comment format to enable document auto generation.
4. 'JSDoc2DoxygenFormat.txt': descript how the js2doxy tool works.(Maybe useful when you want to expand the comment syntax).