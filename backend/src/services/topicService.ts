import { Client, PrivateKey, TokenMintTransaction, TokenId, TransferTransaction, AccountId, TopicId, TopicCreateTransaction, TopicMessageSubmitTransaction } from '@hashgraph/sdk';
import config from '../config/env';
import * as fs from 'fs';
import * as path from 'path';

interface TopicParams {
  userId: string;
  name: string;
  email: string;
  walletAddress: string;
}

interface TopicResult {
  topicId: TopicId;
}

// This service will take care of the creation of the topic in the moment of the Join Request
// After the creation of the topic, we submit a message to it 
// The message will be the request to join the topic
// The request will be a JSON object with the following fields:
// - userId: string
// - name: string
// - email: string
// - walletAddress: string

class TopicService {
  private client: Client;

  constructor() {
    // Initialize Hedera client
    if (config.blockchain.network === 'mainnet') {
      this.client = Client.forMainnet().setOperator( config.blockchain.accountId, config.blockchain.privateKey );
    } else {
      this.client = Client.forTestnet().setOperator( config.blockchain.accountId, config.blockchain.privateKey );
    }
  }

  /**
   * Create a topic for a user
   */
  async createTopic({ userId, name, email, walletAddress }: TopicParams): Promise<TopicResult> {
    try {
      
      // Create a topic
      const topic = await new TopicCreateTransaction()
        .setTopicMemo(`Topic created for ${walletAddress}`)
        .freezeWith(this.client)
        .sign(PrivateKey.fromString(config.blockchain.privateKey));
      
      const topicSubmit = await topic.execute(this.client);
      const topicRx = await topicSubmit.getReceipt(this.client);
      
      const topicId = topicRx.topicId;
      
      if (!topicId) {
        throw new Error('Failed to retrieve topic ID from transaction receipt');
      }

      console.log(`Topic created successfully: ${topicId}`);

      return {
        topicId
      };
    } catch (error) {
      console.error('Error creating topic:', error);
      throw new Error('Failed to create topic');
    }
  }

  async submitMessageToTopic(topicId: TopicId, message: string): Promise<void> {
    try {
      // Submit a message to the topic
      const topic = await new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(message)
        .freezeWith(this.client)
        .sign(PrivateKey.fromString(config.blockchain.privateKey));

      const topicSubmit = await topic.execute(this.client);
      const topicRx = await topicSubmit.getReceipt(this.client);

      console.log(`Message submitted to topic: ${topicId}`);

    } catch (error) {
      console.error('Error submitting message to topic:', error);
      throw new Error('Failed to submit message to topic');
    }
  }

  /**
   * Get messages from a topic using Hedera Mirror Node API
   */
  async getTopicMessages(topicId: string): Promise<any[]> {
    try {
      const network = config.blockchain.network === 'mainnet' ? 'mainnet' : 'testnet';
      const mirrorNodeUrl = `https://${network}.mirrornode.hedera.com/api/v1/topics/${topicId}/messages`;
      
      const response = await fetch(mirrorNodeUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch topic messages: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Decode messages from base64
      const messages = data.messages?.map((msg: any) => {
        try {
          const decodedMessage = Buffer.from(msg.message, 'base64').toString('utf-8');
          return {
            ...msg,
            decodedMessage: JSON.parse(decodedMessage),
            timestamp: new Date(parseFloat(msg.consensus_timestamp) * 1000).toISOString()
          };
        } catch (error) {
          return {
            ...msg,
            decodedMessage: Buffer.from(msg.message, 'base64').toString('utf-8'),
            timestamp: new Date(parseFloat(msg.consensus_timestamp) * 1000).toISOString()
          };
        }
      }) || [];
      
      return messages;
    } catch (error) {
      console.error('Error fetching topic messages:', error);
      throw new Error('Failed to fetch topic messages');
    }
  }
}

export default new TopicService(); 