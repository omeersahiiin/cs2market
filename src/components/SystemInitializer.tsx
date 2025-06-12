'use client';

import { useEffect } from 'react';

export default function SystemInitializer() {
  useEffect(() => {
    // Temporarily disabled to avoid client-side errors during deployment
    console.log('🔧 SystemInitializer temporarily disabled');
    
    // TODO: Re-enable when system is stable
    // Initialize system services on client mount
    // const initializeServices = async () => {
    //   try {
    //     const response = await fetch('/api/system/initialize', {
    //       method: 'POST'
    //     });
    //     
    //     if (response.ok) {
    //       console.log('✅ System services initialized');
    //     } else {
    //       console.error('❌ Failed to initialize system services');
    //     }
    //   } catch (error) {
    //     console.error('❌ Error initializing system services:', error);
    //   }
    // };

    // initializeServices();
  }, []);

  return null; // This component doesn't render anything
} 