/*
(c) Copyright 2020 Akamai Technologies, Inc. Licensed under Apache 2 license.
Version: 1.1
Purpose:  Modify an HTML streamed response by replacing a text string two times across the entire response.
*/

import { httpRequest } from 'http-request';
import { createResponse } from 'create-response';
import { TextEncoderStream, TextDecoderStream } from 'text-encode-transform';
import { FindAndReplaceStream } from 'find-replace-stream.js';

export function responseProvider (request) {

        var info = {};

  info.continent = (request.userLocation.continent) ? request.userLocation.continent : 'N/A';
  info.country = (request.userLocation.country) ? request.userLocation.country : 'N/A';
  info.zip = (request.userLocation.zipCode) ? request.userLocation.zipCode : 'N/A';
  info.region = (request.userLocation.region) ? request.userLocation.region : 'N/A';
  info.city = (request.userLocation.city) ? request.userLocation.city : 'N/A';

  info.source = 'Akamai EdgeWorkers';
  info.rawData = JSON.stringify(request.userLocation)

  const languageMap = [
    {
      region: 'AP',
      language: 'telugu'
    },
    {
      region: 'MP',
      language: 'hindi'
    },
    {
      region: 'DL',
      language: 'hindi'
    },
    {
      region: 'MH',
      language: 'marathi'
    },
    {
      region: 'KA',
      language: 'kannada'
    },
    {
      region: 'TN',
      language: 'tamil'
    },
    {
      region: 'KL',
      language: 'malayalam'
    },
    {
      region: 'WB',
      language: 'bengali'
    },
    {
      region: 'GJ',
      language: 'gujarati'
    }
  ];
  
  const userRegion = request.userLocation.region;
  const language = languageMap.find(lang => lang.region === userRegion)?.language ?? 'english';


  // Get text to be searched for and new replacement text from Property Manager variables in the request object.
  const tosearchfor = "english";
  const newtext = language;
  // Set to 0 to replace all, otherwise a number larger than 0 to limit replacements
  const howManyReplacements = 3;

  return httpRequest(`${request.scheme}://${request.host}/jiogames/v4.final.html`).then(response => {
    // Get headers from response
    let headers = response.getHeaders();
    // Remove content-encoding header.  The response stream from EdgeWorkers is not encoded.
    // If original response contains `Content-Encoding: gzip`, then the Content-Encoding header does not match the actual encoding. 
    delete headers["content-encoding"];
    // Remove `Content-Length` header.  Find/replace is likely to change the content length.
    // Leaving the Length of the original content would be incorrect.
    delete headers["content-length"];
    
    return createResponse(
      response.status,
      headers,
      response.body
          .pipeThrough(new TextDecoderStream())
          .pipeThrough(new FindAndReplaceStream(tosearchfor, newtext, howManyReplacements))
          .pipeThrough(new TextEncoderStream())
    );
  });
}