# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Keep classes for React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep classes for Expo
-keep class expo.modules.** { *; }

# Keep the app package
-keep class com.anonymous.rephelperfrontend.** { *; }

# JSI
-keep class **/jsi.natives.** { *; }
-keep class com.swmansion.reanimated.** { *; }

# JSON
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# Splash Screen
-keep class expo.modules.splashscreen.** { *; }

# Hermes
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# Turbo Modules
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:
