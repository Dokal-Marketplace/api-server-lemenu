// src/data/whatsappTemplateLibrary.ts

export interface TemplateDefinition {
    id: string;
    name: string;
    displayName: string;
    description: string;
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    language: string;
    components: any[];
    useCase: string;
    variables?: string[];
    preview?: string;
  }
  
  export const restaurantTemplateLibrary: TemplateDefinition[] = [
    {
      id: 'order_confirmation',
      name: 'order_confirmation',
      displayName: 'Order Confirmation',
      description: 'Confirm customer orders with order details',
      category: 'UTILITY',
      language: 'en',
      useCase: 'Send immediately after order is placed',
      variables: ['customer_name', 'order_number', 'total_amount'],
      preview: 'Hi {{customer_name}}, your order #{{order_number}} has been confirmed! Total: ${{total_amount}}',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Order Confirmed ✅'
        },
        {
          type: 'BODY',
          text: 'Hi {{1}}, thank you for your order!\n\nOrder #{{2}}\nTotal: ${{3}}\n\nWe\'re preparing your order and will notify you when it\'s ready.'
        },
        {
          type: 'FOOTER',
          text: 'Thanks for choosing us!'
        }
      ]
    },
    {
      id: 'order_ready_pickup',
      name: 'order_ready_pickup',
      displayName: 'Order Ready for Pickup',
      description: 'Notify customers when their order is ready',
      category: 'UTILITY',
      language: 'en',
      useCase: 'Send when order is ready for pickup',
      variables: ['customer_name', 'order_number'],
      preview: 'Hi {{customer_name}}, your order #{{order_number}} is ready for pickup!',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Order Ready! 🎉'
        },
        {
          type: 'BODY',
          text: 'Hi {{1}}, great news!\n\nYour order #{{2}} is ready for pickup.\n\nPlease come to the counter with your order number.'
        },
        {
          type: 'FOOTER',
          text: 'See you soon!'
        }
      ]
    },
    {
      id: 'delivery_on_the_way',
      name: 'delivery_on_the_way',
      displayName: 'Delivery On The Way',
      description: 'Notify customers when delivery is on the way',
      category: 'UTILITY',
      language: 'en',
      useCase: 'Send when driver is assigned and en route',
      variables: ['customer_name', 'order_number', 'estimated_time'],
      preview: 'Hi {{customer_name}}, your order #{{order_number}} is on the way! ETA: {{estimated_time}} minutes',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'On The Way! 🚗'
        },
        {
          type: 'BODY',
          text: 'Hi {{1}}, your order #{{2}} is on the way!\n\nEstimated arrival: {{3}} minutes\n\nPlease have your payment ready if you selected cash on delivery.'
        },
        {
          type: 'FOOTER',
          text: 'Track your order in real-time'
        }
      ]
    },
    {
      id: 'delivery_completed',
      name: 'delivery_completed',
      displayName: 'Delivery Completed',
      description: 'Confirm delivery completion',
      category: 'UTILITY',
      language: 'en',
      useCase: 'Send after successful delivery',
      variables: ['customer_name', 'order_number'],
      preview: 'Hi {{customer_name}}, your order #{{order_number}} has been delivered. Enjoy your meal!',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Delivered Successfully ✅'
        },
        {
          type: 'BODY',
          text: 'Hi {{1}}, your order #{{2}} has been delivered.\n\nWe hope you enjoy your meal!\n\nPlease let us know if anything is missing or not as expected.'
        },
        {
          type: 'FOOTER',
          text: 'Thank you for your order!'
        }
      ]
    },
    {
      id: 'table_reservation_confirmation',
      name: 'table_reservation_confirmation',
      displayName: 'Table Reservation Confirmation',
      description: 'Confirm table reservations',
      category: 'UTILITY',
      language: 'en',
      useCase: 'Send after table reservation is made',
      variables: ['customer_name', 'date', 'time', 'party_size'],
      preview: 'Hi {{customer_name}}, your table for {{party_size}} is confirmed for {{date}} at {{time}}',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Reservation Confirmed 🍽️'
        },
        {
          type: 'BODY',
          text: 'Hi {{1}}, your table reservation is confirmed!\n\nDate: {{2}}\nTime: {{3}}\nParty Size: {{4}}\n\nWe look forward to serving you!'
        },
        {
          type: 'FOOTER',
          text: 'See you soon!'
        }
      ]
    },
    {
      id: 'reservation_reminder',
      name: 'reservation_reminder',
      displayName: 'Reservation Reminder',
      description: 'Remind customers about upcoming reservations',
      category: 'UTILITY',
      language: 'en',
      useCase: 'Send 2-4 hours before reservation time',
      variables: ['customer_name', 'time', 'party_size'],
      preview: 'Hi {{customer_name}}, reminder: Your table for {{party_size}} is reserved for today at {{time}}',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Reservation Reminder 🔔'
        },
        {
          type: 'BODY',
          text: 'Hi {{1}}, this is a friendly reminder!\n\nYour table for {{3}} is reserved for today at {{2}}.\n\nWe look forward to seeing you!'
        },
        {
          type: 'FOOTER',
          text: 'Reply CANCEL if you need to cancel'
        }
      ]
    },
    {
      id: 'payment_received',
      name: 'payment_received',
      displayName: 'Payment Received',
      description: 'Confirm payment receipt',
      category: 'UTILITY',
      language: 'en',
      useCase: 'Send after payment is processed',
      variables: ['customer_name', 'amount', 'payment_method', 'order_number'],
      preview: 'Hi {{customer_name}}, payment of ${{amount}} received for order #{{order_number}}',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Payment Received ✅'
        },
        {
          type: 'BODY',
          text: 'Hi {{1}}, we have received your payment.\n\nAmount: ${{2}}\nPayment Method: {{3}}\nOrder #{{4}}\n\nThank you for your payment!'
        },
        {
          type: 'FOOTER',
          text: 'Receipt will be sent via email'
        }
      ]
    },
    {
      id: 'feedback_request',
      name: 'feedback_request',
      displayName: 'Feedback Request',
      description: 'Request customer feedback after order',
      category: 'UTILITY',
      language: 'en',
      useCase: 'Send 30-60 minutes after delivery/pickup',
      variables: ['customer_name', 'order_number'],
      preview: 'Hi {{customer_name}}, how was your order #{{order_number}}? We\'d love your feedback!',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'How Was Your Meal? ⭐'
        },
        {
          type: 'BODY',
          text: 'Hi {{1}}, we hope you enjoyed your order #{{2}}!\n\nWe\'d love to hear your feedback to help us improve.\n\nPlease rate your experience:'
        },
        {
          type: 'FOOTER',
          text: 'Your feedback matters!'
        },
        {
          type: 'BUTTONS',
          buttons: [
            {
              type: 'QUICK_REPLY',
              text: '⭐⭐⭐⭐⭐ Excellent'
            },
            {
              type: 'QUICK_REPLY',
              text: '⭐⭐⭐⭐ Good'
            },
            {
              type: 'QUICK_REPLY',
              text: '⭐⭐⭐ Average'
            }
          ]
        }
      ]
    },
    {
      id: 'special_offer',
      name: 'special_offer',
      displayName: 'Special Offer',
      description: 'Promote special offers and discounts',
      category: 'MARKETING',
      language: 'en',
      useCase: 'Send for marketing campaigns',
      variables: ['customer_name', 'offer_details', 'expiry_date'],
      preview: 'Hi {{customer_name}}, special offer: {{offer_details}}. Valid until {{expiry_date}}',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Special Offer Just For You! 🎁'
        },
        {
          type: 'BODY',
          text: 'Hi {{1}}, we have an exclusive offer for you!\n\n{{2}}\n\nValid until: {{3}}\n\nDon\'t miss out!'
        },
        {
          type: 'FOOTER',
          text: 'Terms and conditions apply'
        },
        {
          type: 'BUTTONS',
          buttons: [
            {
              type: 'QUICK_REPLY',
              text: 'Order Now'
            },
            {
              type: 'QUICK_REPLY',
              text: 'View Menu'
            }
          ]
        }
      ]
    },
    {
      id: 'order_cancelled',
      name: 'order_cancelled',
      displayName: 'Order Cancelled',
      description: 'Notify customers about order cancellation',
      category: 'UTILITY',
      language: 'en',
      useCase: 'Send when order is cancelled',
      variables: ['customer_name', 'order_number', 'reason'],
      preview: 'Hi {{customer_name}}, your order #{{order_number}} has been cancelled',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Order Cancelled'
        },
        {
          type: 'BODY',
          text: 'Hi {{1}}, we\'re sorry to inform you that order #{{2}} has been cancelled.\n\nReason: {{3}}\n\nIf you have any questions, please contact us.'
        },
        {
          type: 'FOOTER',
          text: 'We apologize for the inconvenience'
        }
      ]
    },
    {
      id: 'welcome_new_customer',
      name: 'welcome_new_customer',
      displayName: 'Welcome New Customer',
      description: 'Welcome first-time customers',
      category: 'UTILITY',
      language: 'en',
      useCase: 'Send after first order or registration',
      variables: ['customer_name', 'discount_code'],
      preview: 'Welcome {{customer_name}}! Here\'s {{discount_code}} for your next order',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Welcome! 🎉'
        },
        {
          type: 'BODY',
          text: 'Hi {{1}}, welcome to our restaurant family!\n\nAs a thank you for joining us, here\'s a special discount code: {{2}}\n\nUse it on your next order and enjoy!'
        },
        {
          type: 'FOOTER',
          text: 'We\'re glad to have you!'
        }
      ]
    }
  ];
  
  // Spanish versions (Peru/LATAM)
  export const restaurantTemplateLibraryES: TemplateDefinition[] = [
    {
      id: 'confirmacion_pedido',
      name: 'confirmacion_pedido',
      displayName: 'Confirmación de Pedido',
      description: 'Confirmar pedidos de clientes con detalles',
      category: 'UTILITY',
      language: 'es_PE',
      useCase: 'Enviar inmediatamente después de realizar el pedido',
      variables: ['nombre_cliente', 'numero_pedido', 'monto_total'],
      preview: 'Hola {{nombre_cliente}}, tu pedido #{{numero_pedido}} ha sido confirmado! Total: S/{{monto_total}}',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Pedido Confirmado ✅'
        },
        {
          type: 'BODY',
          text: 'Hola {{1}}, ¡gracias por tu pedido!\n\nPedido #{{2}}\nTotal: S/{{3}}\n\nEstamos preparando tu pedido y te notificaremos cuando esté listo.'
        },
        {
          type: 'FOOTER',
          text: '¡Gracias por elegirnos!'
        }
      ]
    },
    {
      id: 'pedido_listo_recojo',
      name: 'pedido_listo_recojo',
      displayName: 'Pedido Listo para Recoger',
      description: 'Notificar cuando el pedido está listo',
      category: 'UTILITY',
      language: 'es_PE',
      useCase: 'Enviar cuando el pedido está listo para recoger',
      variables: ['nombre_cliente', 'numero_pedido'],
      preview: 'Hola {{nombre_cliente}}, tu pedido #{{numero_pedido}} está listo para recoger!',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: '¡Pedido Listo! 🎉'
        },
        {
          type: 'BODY',
          text: 'Hola {{1}}, ¡buenas noticias!\n\nTu pedido #{{2}} está listo para recoger.\n\nPor favor acércate al mostrador con tu número de pedido.'
        },
        {
          type: 'FOOTER',
          text: '¡Te esperamos!'
        }
      ]
    },
    // Add more Spanish templates...
  ];
  
  // French versions
  export const restaurantTemplateLibraryFR: TemplateDefinition[] = [
    {
      id: 'confirmation_commande',
      name: 'confirmation_commande',
      displayName: 'Confirmation de Commande',
      description: 'Confirmer les commandes des clients avec les détails',
      category: 'UTILITY',
      language: 'fr',
      useCase: 'Envoyer immédiatement après la passation de la commande',
      variables: ['nom_client', 'numero_commande', 'montant_total'],
      preview: 'Bonjour {{nom_client}}, votre commande #{{numero_commande}} a été confirmée! Total: {{montant_total}}€',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Commande Confirmée ✅'
        },
        {
          type: 'BODY',
          text: 'Bonjour {{1}}, merci pour votre commande!\n\nCommande #{{2}}\nTotal: {{3}}€\n\nNous préparons votre commande et vous notifierons lorsqu\'elle sera prête.'
        },
        {
          type: 'FOOTER',
          text: 'Merci de nous avoir choisis!'
        }
      ]
    },
    {
      id: 'commande_prete_retrait',
      name: 'commande_prete_retrait',
      displayName: 'Commande Prête à Retirer',
      description: 'Notifier les clients lorsque leur commande est prête',
      category: 'UTILITY',
      language: 'fr',
      useCase: 'Envoyer lorsque la commande est prête à être retirée',
      variables: ['nom_client', 'numero_commande'],
      preview: 'Bonjour {{nom_client}}, votre commande #{{numero_commande}} est prête à être retirée!',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Commande Prête! 🎉'
        },
        {
          type: 'BODY',
          text: 'Bonjour {{1}}, excellente nouvelle!\n\nVotre commande #{{2}} est prête à être retirée.\n\nVeuillez vous présenter au comptoir avec votre numéro de commande.'
        },
        {
          type: 'FOOTER',
          text: 'À bientôt!'
        }
      ]
    },
    {
      id: 'livraison_en_route',
      name: 'livraison_en_route',
      displayName: 'Livraison en Route',
      description: 'Notifier les clients lorsque la livraison est en route',
      category: 'UTILITY',
      language: 'fr',
      useCase: 'Envoyer lorsque le livreur est assigné et en route',
      variables: ['nom_client', 'numero_commande', 'temps_estime'],
      preview: 'Bonjour {{nom_client}}, votre commande #{{numero_commande}} est en route! Arrivée estimée: {{temps_estime}} minutes',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'En Route! 🚗'
        },
        {
          type: 'BODY',
          text: 'Bonjour {{1}}, votre commande #{{2}} est en route!\n\nArrivée estimée: {{3}} minutes\n\nVeuillez avoir votre paiement prêt si vous avez choisi le paiement à la livraison.'
        },
        {
          type: 'FOOTER',
          text: 'Suivez votre commande en temps réel'
        }
      ]
    },
    {
      id: 'livraison_terminee',
      name: 'livraison_terminee',
      displayName: 'Livraison Terminée',
      description: 'Confirmer la fin de la livraison',
      category: 'UTILITY',
      language: 'fr',
      useCase: 'Envoyer après une livraison réussie',
      variables: ['nom_client', 'numero_commande'],
      preview: 'Bonjour {{nom_client}}, votre commande #{{numero_commande}} a été livrée. Bon appétit!',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Livré avec Succès ✅'
        },
        {
          type: 'BODY',
          text: 'Bonjour {{1}}, votre commande #{{2}} a été livrée.\n\nNous espérons que vous apprécierez votre repas!\n\nVeuillez nous informer si quelque chose manque ou n\'est pas conforme à vos attentes.'
        },
        {
          type: 'FOOTER',
          text: 'Merci pour votre commande!'
        }
      ]
    },
    {
      id: 'confirmation_reservation_table',
      name: 'confirmation_reservation_table',
      displayName: 'Confirmation de Réservation de Table',
      description: 'Confirmer les réservations de table',
      category: 'UTILITY',
      language: 'fr',
      useCase: 'Envoyer après la réservation de table',
      variables: ['nom_client', 'date', 'heure', 'nombre_personnes'],
      preview: 'Bonjour {{nom_client}}, votre table pour {{nombre_personnes}} est confirmée pour le {{date}} à {{heure}}',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Réservation Confirmée 🍽️'
        },
        {
          type: 'BODY',
          text: 'Bonjour {{1}}, votre réservation de table est confirmée!\n\nDate: {{2}}\nHeure: {{3}}\nNombre de personnes: {{4}}\n\nNous avons hâte de vous servir!'
        },
        {
          type: 'FOOTER',
          text: 'À bientôt!'
        }
      ]
    },
    {
      id: 'rappel_reservation',
      name: 'rappel_reservation',
      displayName: 'Rappel de Réservation',
      description: 'Rappeler aux clients leurs réservations à venir',
      category: 'UTILITY',
      language: 'fr',
      useCase: 'Envoyer 2-4 heures avant l\'heure de réservation',
      variables: ['nom_client', 'heure', 'nombre_personnes'],
      preview: 'Bonjour {{nom_client}}, rappel: Votre table pour {{nombre_personnes}} est réservée pour aujourd\'hui à {{heure}}',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Rappel de Réservation 🔔'
        },
        {
          type: 'BODY',
          text: 'Bonjour {{1}}, ceci est un rappel amical!\n\nVotre table pour {{3}} personnes est réservée pour aujourd\'hui à {{2}}.\n\nNous avons hâte de vous voir!'
        },
        {
          type: 'FOOTER',
          text: 'Répondez ANNULER si vous devez annuler'
        }
      ]
    },
    {
      id: 'paiement_recu',
      name: 'paiement_recu',
      displayName: 'Paiement Reçu',
      description: 'Confirmer la réception du paiement',
      category: 'UTILITY',
      language: 'fr',
      useCase: 'Envoyer après le traitement du paiement',
      variables: ['nom_client', 'montant', 'methode_paiement', 'numero_commande'],
      preview: 'Bonjour {{nom_client}}, paiement de {{montant}}€ reçu pour la commande #{{numero_commande}}',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Paiement Reçu ✅'
        },
        {
          type: 'BODY',
          text: 'Bonjour {{1}}, nous avons reçu votre paiement.\n\nMontant: {{2}}€\nMéthode de paiement: {{3}}\nCommande #{{4}}\n\nMerci pour votre paiement!'
        },
        {
          type: 'FOOTER',
          text: 'Le reçu sera envoyé par email'
        }
      ]
    },
    {
      id: 'demande_avis',
      name: 'demande_avis',
      displayName: 'Demande d\'Avis',
      description: 'Demander l\'avis du client après la commande',
      category: 'UTILITY',
      language: 'fr',
      useCase: 'Envoyer 30-60 minutes après la livraison/retrait',
      variables: ['nom_client', 'numero_commande'],
      preview: 'Bonjour {{nom_client}}, comment était votre commande #{{numero_commande}}? Nous aimerions votre avis!',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Comment Était Votre Repas? ⭐'
        },
        {
          type: 'BODY',
          text: 'Bonjour {{1}}, nous espérons que vous avez apprécié votre commande #{{2}}!\n\nNous aimerions entendre vos commentaires pour nous aider à nous améliorer.\n\nVeuillez noter votre expérience:'
        },
        {
          type: 'FOOTER',
          text: 'Vos commentaires comptent!'
        },
        {
          type: 'BUTTONS',
          buttons: [
            {
              type: 'QUICK_REPLY',
              text: '⭐⭐⭐⭐⭐ Excellent'
            },
            {
              type: 'QUICK_REPLY',
              text: '⭐⭐⭐⭐ Bien'
            },
            {
              type: 'QUICK_REPLY',
              text: '⭐⭐⭐ Moyen'
            }
          ]
        }
      ]
    },
    {
      id: 'offre_speciale',
      name: 'offre_speciale',
      displayName: 'Offre Spéciale',
      description: 'Promouvoir les offres spéciales et réductions',
      category: 'MARKETING',
      language: 'fr',
      useCase: 'Envoyer pour les campagnes marketing',
      variables: ['nom_client', 'details_offre', 'date_expiration'],
      preview: 'Bonjour {{nom_client}}, offre spéciale: {{details_offre}}. Valable jusqu\'au {{date_expiration}}',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Offre Spéciale Juste Pour Vous! 🎁'
        },
        {
          type: 'BODY',
          text: 'Bonjour {{1}}, nous avons une offre exclusive pour vous!\n\n{{2}}\n\nValable jusqu\'au: {{3}}\n\nNe manquez pas cette occasion!'
        },
        {
          type: 'FOOTER',
          text: 'Conditions générales applicables'
        },
        {
          type: 'BUTTONS',
          buttons: [
            {
              type: 'QUICK_REPLY',
              text: 'Commander Maintenant'
            },
            {
              type: 'QUICK_REPLY',
              text: 'Voir le Menu'
            }
          ]
        }
      ]
    },
    {
      id: 'commande_annulee',
      name: 'commande_annulee',
      displayName: 'Commande Annulée',
      description: 'Notifier les clients de l\'annulation de commande',
      category: 'UTILITY',
      language: 'fr',
      useCase: 'Envoyer lorsque la commande est annulée',
      variables: ['nom_client', 'numero_commande', 'raison'],
      preview: 'Bonjour {{nom_client}}, votre commande #{{numero_commande}} a été annulée',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Commande Annulée'
        },
        {
          type: 'BODY',
          text: 'Bonjour {{1}}, nous sommes désolés de vous informer que la commande #{{2}} a été annulée.\n\nRaison: {{3}}\n\nSi vous avez des questions, veuillez nous contacter.'
        },
        {
          type: 'FOOTER',
          text: 'Nous nous excusons pour le désagrément'
        }
      ]
    },
    {
      id: 'bienvenue_nouveau_client',
      name: 'bienvenue_nouveau_client',
      displayName: 'Bienvenue Nouveau Client',
      description: 'Souhaiter la bienvenue aux nouveaux clients',
      category: 'UTILITY',
      language: 'fr',
      useCase: 'Envoyer après la première commande ou inscription',
      variables: ['nom_client', 'code_reduction'],
      preview: 'Bienvenue {{nom_client}}! Voici {{code_reduction}} pour votre prochaine commande',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Bienvenue! 🎉'
        },
        {
          type: 'BODY',
          text: 'Bonjour {{1}}, bienvenue dans notre famille de restaurant!\n\nEn remerciement de votre adhésion, voici un code de réduction spécial: {{2}}\n\nUtilisez-le lors de votre prochaine commande et profitez-en!'
        },
        {
          type: 'FOOTER',
          text: 'Nous sommes ravis de vous compter parmi nous!'
        }
      ]
    }
  ];
  
  // Function to get templates by language
  export const getTemplatesByLanguage = (language: string): TemplateDefinition[] => {
    switch (language) {
      case 'es':
      case 'es_PE':
      case 'es_MX':
      case 'es_AR':
        return restaurantTemplateLibraryES;
      case 'fr':
      case 'fr_FR':
      case 'fr_CA':
      case 'fr_BE':
        return restaurantTemplateLibraryFR;
      case 'en':
      case 'en_US':
      default:
        return restaurantTemplateLibrary;
    }
  };
  
  // Function to get a specific template by ID
  export const getTemplateById = (id: string, language: string = 'en'): TemplateDefinition | undefined => {
    const templates = getTemplatesByLanguage(language);
    return templates.find(t => t.id === id);
  };