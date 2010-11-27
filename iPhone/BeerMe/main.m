//
//  main.m
//  BeerMe
//
//  Created by Steve Gill on 10-11-24.
//  Copyright __MyCompanyName__ 2010. All rights reserved.
//

#import <UIKit/UIKit.h>

int main(int argc, char *argv[]) {
    
    NSAutoreleasePool * pool = [[NSAutoreleasePool alloc] init];
    int retVal = UIApplicationMain(argc, argv, nil, @"BeerMeAppDelegate");
    [pool release];
    return retVal;
}
