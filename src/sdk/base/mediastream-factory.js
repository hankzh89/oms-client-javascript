// Copyright © 2017 Intel Corporation. All Rights Reserved.
'use strict';
import * as utils from './utils.js'
import Logger from './logger.js'
import { Resolution } from './mediaformat.js'
/**
  Constraints for creating an audio MediaStreamTrack.
*/
export class MediaStreamTrackAudioConstraints {}
/**
  Constraints for creating an audio MediaStreamTrack from mic.
  @details Currently, only deviceId is supported. please create an MediaStreamTrackDeviceConstraintsForAudio and pass it to createMediaStream function to create a MediaStream with audio captured from mic.
*/
export class MediaStreamTrackDeviceConstraintsForAudio extends MediaStreamTrackAudioConstraints {}
/**
  Constraints for creating an audio MediaStreamTrack from screen cast.
  @details Currently, constrains for audio from screen cast are not supported. please create an MediaStreamTrackScreenCastConstraintsForAudio and pass it to createMediaStream function to create a MediaStream with audio captured from screen cast.
*/
export class MediaStreamTrackScreenCastConstraintsForAudio extends MediaStreamTrackAudioConstraints {}
/**
  Constraints for creating a video MediaStreamTrack.
*/
export class MediaStreamTrackVideoConstraints {}
/**
  Constraints for creating a video MediaStreamTrack from camera.
*/
export class MediaStreamTrackDeviceConstraintsForVideo extends MediaStreamTrackVideoConstraints {}
/**
  Constraints for creating a video MediaStreamTrack from screen cast.
*/
export class MediaStreamTrackScreenCastConstraintsForVideo extends MediaStreamTrackVideoConstraints {}
/**
  Constraints for creating a MediaStream from screen mic and camera.
*/
export class MediaStreamDeviceConstraints {
  constructor(audioConstraints = false, videoConstraints = false) {
    if (((typeof audioConstraints !== 'boolean') && !(audioConstraints instanceof MediaStreamTrackDeviceConstraintsForAudio)) ||
      ((typeof videoConstraints !== 'boolean') && !(videoConstraints instanceof MediaStreamTrackDeviceConstraintsForVideo))
    ) throw new TypeError(
      'Invalid type of audioConstrains or videoConstraints.');
    this.audio = audioConstraints;
    this.video = videoConstraints;
  }
}
/**
  Constraints for creating a MediaStream from screen cast.
*/
export class MediaStreamScreenCastConstraints {
  constructor(audioConstraints = false, videoConstraints = false) {
    if (((typeof audioConstraints !== 'boolean') && !(audioConstraints instanceof MediaStreamTrackScreenCastConstraintsForAudio)) ||
      ((typeof videoConstraints !== 'boolean') && !(videoConstraints instanceof MediaStreamTrackScreenCastConstraintsForVideo))
    ) throw new TypeError(
      'Invalid type of audioConstrains or videoConstraints.');
    this.audio = audioConstraints;
    this.video = videoConstraints;
  }
}
export class MediaStreamFactory {
  static createMediaStream(constraints) {
    if (!(constraints instanceof MediaStreamDeviceConstraints) && !(
        constraints instanceof MediaStreamScreenCastConstraints)) {
      return Promise.reject(new TypeError('Invalid type of constraints.'));
    }
    if (constraints instanceof MediaStreamScreenCastConstraints && !utils.isChrome() &&
      !utils.isFirefox()) {
      return Promise.reject(new TypeError(
        'Screen sharing only supports Chrome and Firefox.'));
    }
    // Screen sharing on Chrome does not work with the latest constraints format.
    if (constraints instanceof MediaStreamScreenCastConstraints && utils.isChrome()) {
      if (!constraints.extensionId) {
        return Promise.reject(new TypeError(
          'Extension ID must be specified for screen sharing on Chrome.'));
      }
      const desktopCaptureSources = ['screen', 'window', 'tab'];
      if (constraints.audio) {
        desktopCaptureSources.push('audio');
      }
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(constraints.extensionId, {
          getStream: desktopCaptureSources
        }, function(response) {
          if (response === undefined) {
            return reject(new Error(chrome.runtime.lastError.message));
          }
          if (constraints.audio && typeof response.options !==
            'object') {
            Logger.warning(
              'Desktop sharing with audio requires the latest Chrome extension. Your audio constraints will be ignored.'
            );
          }
          const mediaConstraints = Object.create({});
          if (constraints.audio && (typeof response.options ===
              'object')) {
            if (response.options.canRequestAudioTrack) {
              mediaConstraints.audio = {
                mandatory: {
                  chromeMediaSource: 'desktop',
                  chromeMediaSourceId: response.streamId
                }
              }
            } else {
              Logger.warning(
                'Sharing screen with audio was not selected by user.'
              );
            }
            mediaConstraints.video = Object.create({});
            mediaConstraints.video.mandatory = Object.create({});
            mediaConstraints.video.mandatory.chromeMediaSource =
              'desktop';
            mediaConstraints.video.mandatory.chromeMediaSourceId =
              response.streamId;
            // Transform new constraint format to the old style. Because chromeMediaSource only supported in the old style, and mix new and old style will result type error: "Cannot use both optional/mandatory and specific or advanced constraints.".
            if (constraints.video.resolution) {
              mediaConstraints.video.mandatory.maxHeight =
                mediaConstraints.video.mandatory.minHeight =
                constraints.video.resolution.height;
              mediaConstraints.video.mandatory.maxWidth =
                mediaConstraints.video.mandatory.minWidth =
                constraints.video.resolution.width;
            }
            if (constraints.video.frameRate) {
              mediaConstraints.video.mandatory.minFrameRate =
                constraints.video.frameRate;
              mediaConstraints.video.mandatory.maxFrameRate =
                constraints.video.frameRate;
            }
            resolve(navigator.mediaDevices.getUserMedia(
              mediaConstraints));
          };
        });
      })
    } else {
      if (!constraints.audio && !constraints.video) {
        return Promise.reject(new TypeError(
          'At least one of audio and video must be requested.'));
      }
      const mediaConstraints = Object.create({});
      if (constraints.audio instanceof MediaStreamTrackAudioConstraints) {
        mediaConstraints.audio = Object.create({});
        mediaConstraints.audio.deviceId = constraints.audio.deviceId;
      } else {
        mediaConstraints.audio = constraints.audio;
      }
      if (constraints.audio instanceof MediaStreamTrackScreenCastConstraintsForAudio) {
        Logger.warning(
          'Screen sharing with audio is not supported in Firefox.');
        mediaConstraints.audio = false;
      }
      if (constraints.video instanceof MediaStreamTrackVideoConstraints) {
        mediaConstraints.video = Object.create({});
        if (constraints.video.frameRate instanceof Number) {
          mediaConstraints.video.frameRate = constraints.video.frameRate;
        }
        if (constraints.video.resolution instanceof Resolution) {
          mediaConstraints.video.width = constraints.video.resolution.width;
          mediaConstraints.video.height = constraints.video.resolution.height;
        }
        if (constraints.video.deviceId instanceof String) {
          mediaConstraints.video.deviceId = constraints.video.deviceId;
        }
        if (utils.isFirefox() && constraints.video instanceof MediaStreamTrackScreenCastConstraintsForVideo) {
          mediaConstraints.video.mediaSource = 'screen';
        }
      } else {
        mediaConstraints.video = constraints.video;
      }
      return navigator.mediaDevices.getUserMedia(mediaConstraints);
    }
  }
}
