'use client';

import React from 'react';
import type { Playground } from '@/lib/types';

interface DescriptionProps {
  playground: Playground;
}

export function Description({ playground }: DescriptionProps) {
  const isDocker = playground.id.includes('docker') || !playground.id.includes('k8s');

  if (isDocker) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4">
            Play with Docker (PWD) is a project hacked by{' '}
            <a
              href="https://www.twitter.com/marcosnils"
              className="text-blue-600 hover:text-blue-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              Marcos Liljedhal
            </a>{' '}
            and{' '}
            <a
              href="https://www.twitter.com/xetorthio"
              className="text-blue-600 hover:text-blue-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              Jonathan Leibiusky
            </a>{' '}
            and sponsored by Docker Inc.
          </p>
          <p className="text-gray-700">
            PWD is a Docker playground which allows users to run Docker commands in a matter of
            seconds. It gives the experience of having a free Alpine Linux Virtual Machine in
            browser, where you can build and run Docker containers and even create clusters in{' '}
            <a
              href="https://docs.docker.com/engine/swarm/"
              className="text-blue-600 hover:text-blue-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              Docker Swarm Mode
            </a>
            . Under the hood Docker-in-Docker (DinD) is used to give the effect of multiple
            VMs/PCs. In addition to the playground, PWD also includes a training site composed of
            a large set of Docker labs and quizzes from beginner to advanced level available at{' '}
            <a
              href="http://training.play-with-docker.com/"
              className="text-blue-600 hover:text-blue-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              training.play-with-docker.com
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="prose max-w-none">
        <p className="text-gray-700 mb-4">
          Play with Kubernetes is a labs site provided by{' '}
          <a
            href="https://docker.com"
            className="text-blue-600 hover:text-blue-800"
            target="_blank"
            rel="noopener noreferrer"
          >
            Docker
          </a>{' '}
          and created by Tutorius. Play with Kubernetes is a playground which allows users to run
          K8s clusters in a matter of seconds. It gives the experience of having a free Alpine
          Linux Virtual Machine in browser. Under the hood Docker-in-Docker (DinD) is used to give
          the effect of multiple VMs/PCs.
        </p>
        <p className="text-gray-700">
          If you want to learn more about Kubernetes, consider the{' '}
          <a
            href="https://training.play-with-kubernetes.com/"
            className="text-blue-600 hover:text-blue-800"
            target="_blank"
            rel="noopener noreferrer"
          >
            Play with Kubernetes Classroom
          </a>{' '}
          which provides more directed learning using an integrated Play with Kubernetes
          commandline.
        </p>
      </div>
    </div>
  );
}

