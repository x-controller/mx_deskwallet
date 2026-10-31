<script setup>
import HomeTopBar from '@/themes/material/components/home/HomeTopBar.vue'
import GroupDrawer from '@/themes/material/components/home/GroupDrawer.vue'
import WalletList from '@/themes/material/components/home/WalletList.vue'
import StatusBar from '@/themes/material/components/home/StatusBar.vue'
import AppearanceDialog from '@/themes/material/components/home/AppearanceDialog.vue'
import TxTable from '@/themes/material/components/tx/TxTable.vue'
import ImportWalletDialog from '@/themes/material/components/wallet/ImportWalletDialog.vue'
import WatchWalletDialog from '@/themes/material/components/wallet/WatchWalletDialog.vue'
import CreateWalletDialog from '@/themes/material/components/wallet/CreateWalletDialog.vue'
import EditWalletDialog from '@/themes/material/components/wallet/EditWalletDialog.vue'
import TransferDialog from '@/themes/material/components/wallet/TransferDialog.vue'
import NetworkDialog from '@/themes/material/components/network/NetworkDialog.vue'
import DrainDialog from '@/themes/material/components/drain/DrainDialog.vue'
import BatchTransferDialog from '@/themes/material/components/batch/BatchTransferDialog.vue'
import CollectDialog from '@/themes/material/components/batch/CollectDialog.vue'
import SwapDialog from '@/themes/material/components/swap/SwapDialog.vue'
import DappDialog from '@/themes/material/components/dapp/DappDialog.vue'
import DappProposalDialog from '@/themes/material/components/dapp/DappProposalDialog.vue'
import DappRequestDialog from '@/themes/material/components/dapp/DappRequestDialog.vue'
import { useHomePage } from '@/composables/home/useHomePage'

const {
  walletStore, networkStore, txStore, dappStore,
  mode, activeGroupId, keyword, refreshing, dialogs,
  editingWallet, transferWallet, drainTargets, swapTargets, collectTargets, batchSender,
  visibleWallets, visibleTxs, defaultGroupId, drainCandidates, batchScope,
  drainHint, swapHint, drainDisabled, swapDisabled,
  collectHint, collectDisabled, batchHintText, batchDisabled,
  refresh, refreshMissing, refreshTransfer, refreshDrain, refreshSwap, refreshCollect, refreshBatch,
  openDrain, openSwap, openCollect, openBatch, openTransfer, openEdit, lock,
} = useHomePage()
</script>

<template>
  <div class="home">
    <HomeTopBar
      v-model:keyword="keyword"
      v-model:mode="mode"
      :refreshing="refreshing"
      :drain-hint="drainHint"
      :drain-disabled="drainDisabled"
      :swap-hint="swapHint"
      :swap-disabled="swapDisabled"
      :batch-hint="batchHintText"
      :batch-disabled="batchDisabled"
      :collect-hint="collectHint"
      :collect-disabled="collectDisabled"
      :dapp-pending="dappStore.pendingCount"
      @dapp="dialogs.dapp = true"
      @import="dialogs.import = true"
      @create="dialogs.create = true"
      @watch="dialogs.watch = true"
      @drain="openDrain(drainCandidates)"
      @swap="openSwap(drainCandidates)"
      @batch="openBatch"
      @collect="openCollect(drainCandidates)"
      @network="dialogs.network = true"
      @refresh="refresh"
      @appearance="dialogs.appearance = true"
      @lock="lock"
    />

    <div class="home__body">
      <GroupDrawer v-model="activeGroupId" />
      <main class="home__main">
        <TxTable v-if="mode === 'history'" :txs="visibleTxs" :filtered="txStore.txs.length > 0" />
        <WalletList
          v-else
          :wallets="visibleWallets"
          :filtered="walletStore.wallets.length > 0"
          :refreshing="refreshing"
          @edit="openEdit"
          @transfer="openTransfer"
          @swap="openSwap([$event])"
          @drain="openDrain([$event])"
          @import="dialogs.import = true"
          @create="dialogs.create = true"
          @watch="dialogs.watch = true"
        />
      </main>
    </div>

    <StatusBar :mode="mode" />

    <ImportWalletDialog v-model="dialogs.import" :default-group-id="defaultGroupId" @done="refreshMissing" />
    <CreateWalletDialog v-model="dialogs.create" :default-group-id="defaultGroupId" @done="refreshMissing" />
    <WatchWalletDialog v-model="dialogs.watch" :default-group-id="defaultGroupId" @done="refreshMissing" />
    <EditWalletDialog v-model="dialogs.edit" :wallet="editingWallet" />
    <TransferDialog v-model="dialogs.transfer" :wallet="transferWallet" :network="networkStore.activeNetwork" @done="refreshTransfer" />
    <NetworkDialog v-model="dialogs.network" />
    <AppearanceDialog v-model="dialogs.appearance" />
    <DrainDialog v-model="dialogs.drain" :wallets="drainTargets" :network="networkStore.activeNetwork" @done="refreshDrain" />
    <SwapDialog v-model="dialogs.swap" :wallets="swapTargets" :network="networkStore.activeNetwork" @done="refreshSwap" />
    <BatchTransferDialog v-model="dialogs.batch" :wallets="walletStore.signableWallets" :default-wallet="batchSender" :recipients="batchScope" :network="networkStore.activeNetwork" @done="refreshBatch" />
    <CollectDialog v-model="dialogs.collect" :wallets="collectTargets" :network="networkStore.activeNetwork" @done="refreshCollect" />
    <DappDialog v-model="dialogs.dapp" />
    <DappProposalDialog v-if="dappStore.currentProposal" :key="dappStore.currentProposal.id" :proposal="dappStore.currentProposal" />
    <DappRequestDialog v-else-if="dappStore.currentRequest" :key="dappStore.currentRequest.id" :request="dappStore.currentRequest" />
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--md-sys-color-surface);
}

.home__body {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: var(--md-space-4);
  padding: 0 var(--md-space-4);
}

.home__main {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  background: var(--md-sys-color-surface-container-lowest);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-large);
  overflow: hidden;
}
</style>
