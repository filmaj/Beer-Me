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

Libraries Used
----
- [xui](http://www.github.com/xui/xui): a JavaScript framework designed for mobile and PhoneGap use.
- [Lawnchair](http://www.github.com/xui/lawnchair): an offline storage abstraction for mobile and PhoneGap apps.

Authors
----

Developed by [Fil Maj](http://www.twitter.com/filmaj) & [Nitobi](http://www.nitobi.com).

Graphic assets employed were designed by either [Yohei S.](http://www.twitter.com/yoheis) or [Tim Kim](http://www.twitter.com/timkim).

To-dos
----
- It would be cool to add more (PhoneGap) platform support in the build script.