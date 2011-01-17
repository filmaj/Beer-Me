Beer Me
====

A mobile application built on only HTML, CSS and JavaScript, made to run on the [PhoneGap](http://www.phonegap.com) platform.

Thanks to Yahoo and BeerMapping.com for providing open access to data.

Build
----

The build script currently builds a PhoneGap Android-ready project into the `www_android` directory in the root of the repository.

The build script relies on the following to run properly:

- Git
- Ruby
- Java
- [PhoneGap for Android](http://www.github.com/phonegap/phonegap-android), with it on your PATH.

From the root of this repository, simply run:

     $ ./build
     
Note that it also attempts to immediately install the application onto a connected phone or running simulator (by running `ant debug install` from the built Android project directory).

Libraries Used
----
- [xui](http://www.github.com/xui/xui): a JavaScript framework designed for mobile and PhoneGap use.
- [xui-plugins](http://www.github.com/xui/xui-plugins): the 'fx-helpers' portion of this collection of useful xui extensions.
- [Lawnchair](http://www.github.com/xui/lawnchair): an offline storage abstraction for mobile and PhoneGap apps.

Authors
----

Developed by [Fil Maj](http://www.twitter.com/filmaj) & [Nitobi](http://www.nitobi.com).

Graphic assets employed were designed by either [Yohei S.](http://www.twitter.com/yoheis) or [Tim Kim](http://www.twitter.com/timkim).

To-dos
----
- Marker info windows, beer icon
- Cache: lawnchair
- It would be cool to add more (PhoneGap) platform support in the build script.